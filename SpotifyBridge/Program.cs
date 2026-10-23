using System;
using System.IO;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Windows.Media.Control;

namespace SpotifyBridge
{
    class Program
    {
        private static GlobalSystemMediaTransportControlsSessionManager? _sessionManager;
        private static HttpListener? _listener;

        static async Task Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("==================================================");
            Console.WriteLine("🎵 Spicy Lyrics - Spotify Windows GSMTC Köprüsü");
            Console.WriteLine("==================================================");

            try
            {
                _sessionManager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
                Console.WriteLine("✅ Windows Medya Oturum Yöneticisi bağlandı.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Windows Medya Yöneticisi başlatılamadı: {ex.Message}");
                return;
            }

            // HTTP Yerel Sunucu Başlat (Port 48484)
            _listener = new HttpListener();
            _listener.Prefixes.Add("http://localhost:48484/");
            _listener.Prefixes.Add("http://127.0.0.1:48484/");

            try
            {
                _listener.Start();
                Console.WriteLine("🚀 Yerel Köprü Yayında: http://localhost:48484/");
                Console.WriteLine("💡 Timeline Editörü bu köprüye otomatik bağlanacaktır.\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ HTTP Sunucu başlatılamadı: {ex.Message}");
                return;
            }

            _ = Task.Run(ListenLoop);

            Console.WriteLine("Çıkış yapmak için [Enter]'a basabilirsiniz...\n");
            Console.ReadLine();
        }

        private static async Task ListenLoop()
        {
            while (_listener != null && _listener.IsListening)
            {
                try
                {
                    var context = await _listener.GetContextAsync();
                    _ = Task.Run(() => HandleRequest(context));
                }
                catch
                {
                    // Sunucu durdurulduğunda çık
                }
            }
        }

        private static async Task HandleRequest(HttpListenerContext context)
        {
            var req = context.Request;
            var res = context.Response;

            // CORS İzinleri (HTML dosyasının erişebilmesi için)
            res.AddHeader("Access-Control-Allow-Origin", "*");
            res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.AddHeader("Access-Control-Allow-Headers", "Content-Type");

            if (req.HttpMethod == "OPTIONS")
            {
                res.StatusCode = 200;
                res.Close();
                return;
            }

            var path = req.Url?.AbsolutePath.ToLower() ?? "/";

            try
            {
                if (path == "/status")
                {
                    var status = await GetSpotifyStatusAsync();
                    var json = JsonSerializer.Serialize(status);
                    var buffer = Encoding.UTF8.GetBytes(json);

                    res.ContentType = "application/json; charset=utf-8";
                    res.ContentLength64 = buffer.Length;
                    await res.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                }
                else if (path == "/playpause")
                {
                    await TogglePlayPauseAsync();
                    var buffer = Encoding.UTF8.GetBytes("{\"ok\":true}");
                    res.ContentType = "application/json";
                    await res.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                }
                else if (path == "/seek" && req.QueryString["sec"] != null)
                {
                    if (double.TryParse(req.QueryString["sec"], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double sec))
                    {
                        await SeekSpotifyAsync(sec);
                    }
                    var buffer = Encoding.UTF8.GetBytes("{\"ok\":true}");
                    res.ContentType = "application/json";
                    await res.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                }
                else
                {
                    res.StatusCode = 404;
                }
            }
            catch (Exception ex)
            {
                res.StatusCode = 500;
                var errBuffer = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { error = ex.Message }));
                await res.OutputStream.WriteAsync(errBuffer, 0, errBuffer.Length);
            }
            finally
            {
                res.Close();
            }
        }

        private static GlobalSystemMediaTransportControlsSession? GetSpotifySession()
        {
            if (_sessionManager == null) return null;

            var sessions = _sessionManager.GetSessions();
            foreach (var s in sessions)
            {
                var appId = s.SourceAppUserModelId?.ToLower() ?? "";
                if (appId.Contains("spotify"))
                {
                    return s;
                }
            }

            // Eğer spesifik spotify yoksa aktif oturumu al
            return _sessionManager.GetCurrentSession();
        }

        private static async Task<object> GetSpotifyStatusAsync()
        {
            var session = GetSpotifySession();
            if (session == null)
            {
                return new { active = false, message = "Spotify veya medya oturumu bulunamadı" };
            }

            var mediaProps = await session.TryGetMediaPropertiesAsync();
            var playbackInfo = session.GetPlaybackInfo();
            var timeline = session.GetTimelineProperties();

            bool isPlaying = playbackInfo?.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
            double positionSec = 0;
            double durationSec = 0;

            if (timeline != null)
            {
                durationSec = timeline.EndTime.TotalSeconds;

                if (isPlaying)
                {
                    // 🧠 SENİN EKSTRAPOLASYON FORMÜLÜN:
                    // 1. Windows'un son güncelleme anından ŞU ANA KADAR geçen süreyi hesapla:
                    TimeSpan elapsedSinceUpdate = DateTime.UtcNow - timeline.LastUpdatedTime.ToUniversalTime();
                    // 2. Windows'un bildirdiği son konuma geçen bu süreyi EKLE:
                    TimeSpan currentPosition = timeline.Position + elapsedSinceUpdate;

                    // 3. Sınırla (Clamp):
                    if (currentPosition > timeline.EndTime) currentPosition = timeline.EndTime;
                    if (currentPosition < TimeSpan.Zero) currentPosition = TimeSpan.Zero;

                    positionSec = currentPosition.TotalSeconds;
                }
                else
                {
                    positionSec = timeline.Position.TotalSeconds;
                }
            }

            return new
            {
                active = true,
                title = mediaProps?.Title ?? "Bilinmiyor",
                artist = mediaProps?.Artist ?? "Bilinmiyor",
                isPlaying = isPlaying,
                position = positionSec,
                duration = durationSec
            };
        }

        private static async Task TogglePlayPauseAsync()
        {
            var session = GetSpotifySession();
            if (session != null)
            {
                await session.TryTogglePlayPauseAsync();
            }
        }

        private static async Task SeekSpotifyAsync(double targetSeconds)
        {
            var session = GetSpotifySession();
            if (session != null)
            {
                long ticks = (long)(targetSeconds * 10_000_000);
                await session.TryChangePlaybackPositionAsync(ticks);
            }
        }
    }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Prefixes.Add('http://192.168.1.118:8080/')
$listener.Start()
Write-Host 'Local Server running at http://localhost:8080/'
Write-Host 'Network Server running at http://192.168.1.118:8080/ (access from phone)'
$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        try {
            $req = $ctx.Request
            $res = $ctx.Response
            $res.AddHeader("Access-Control-Allow-Origin", "*")

            $urlPath = [System.Net.WebUtility]::UrlDecode($req.Url.AbsolutePath)
            if ($urlPath -eq '/' -or [string]::IsNullOrWhiteSpace($urlPath)) {
                $urlPath = '/index.html'
            }

            $cleanPath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $filePath = [System.IO.Path]::Combine($baseDir, $cleanPath)

            if ([System.IO.File]::Exists($filePath)) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                switch ($ext) {
                    '.html' { $res.ContentType = 'text/html; charset=utf-8' }
                    '.js'   { $res.ContentType = 'text/javascript; charset=utf-8' }
                    '.css'  { $res.ContentType = 'text/css; charset=utf-8' }
                    '.json' { $res.ContentType = 'application/json; charset=utf-8' }
                    '.png'  { $res.ContentType = 'image/png' }
                    '.jpg'  { $res.ContentType = 'image/jpeg' }
                    '.jpeg' { $res.ContentType = 'image/jpeg' }
                    '.svg'  { $res.ContentType = 'image/svg+xml' }
                    default { $res.ContentType = 'application/octet-stream' }
                }
                $res.ContentLength64 = $bytes.Length
                if ($req.HttpMethod -ne 'HEAD') {
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $res.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
                $res.ContentLength64 = $errBytes.Length
                if ($req.HttpMethod -ne 'HEAD') {
                    $res.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            }
            $res.Close()
        } catch {
            Write-Warning "Error processing request: $_"
            try { $ctx.Response.Abort() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}

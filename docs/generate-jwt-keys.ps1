param(
    [string]$Issuer = "http://localhost:8080/auth"
)

$ErrorActionPreference = "Stop"

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("albru-jwt-" + [System.Guid]::NewGuid())
$javaFile = Join-Path $tempDir "GenJwtKeys.java"

try {
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    @'
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

public class GenJwtKeys {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        System.out.println(Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded()));
        System.out.println(Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded()));
    }
}
'@ | Set-Content -LiteralPath $javaFile -Encoding ASCII

    javac $javaFile
    $keys = java -cp $tempDir GenJwtKeys

    Write-Output "JWT_ISSUER=$Issuer"
    Write-Output "JWT_PRIVATE_KEY_BASE64=$($keys[0])"
    Write-Output "JWT_PUBLIC_KEY_BASE64=$($keys[1])"
} finally {
    if (Test-Path $tempDir) {
        Remove-Item -LiteralPath $tempDir -Recurse -Force
    }
}

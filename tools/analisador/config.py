"""Configuração do analisador do MProj (constantes e regras)."""

IGNORAR_DIRS = {"node_modules", ".next", ".git", "generated", ".turbo",
                "dist", "build", "coverage", "__pycache__", ".vercel"}

EXT_CODIGO = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".sql", ".prisma"}

PADROES_SEGREDO = {
    "chave Resend": r"re_[A-Za-z0-9_]{20,}",
    "chave estilo sk-": r"sk-[A-Za-z0-9]{20,}",
    "URL de banco com senha": r"postgres(?:ql)?://[^:\s/]+:[^@\s]+@",
    "chave privada": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
}

# (descrição, padrão, deve_existir)
CHECKS_AUTH = [
    ("Hash de senha forte (scrypt/argon2/bcrypt)", r"scrypt|argon2|bcrypt", True),
    ("Comparação em tempo constante", r"timingSafeEqual", True),
    ("Cookie httpOnly", r"httpOnly", True),
    ("Prefixo __Host- no cookie de sessão", r"__Host-", True),
    ("Limite de tentativas (rate limit)",
     r"rate.?limit|limite.{0,25}(login|tentativa)|tentativas.{0,25}limite", True),
    ("Verificação de origem (CSRF)", r"headers\.get\(.origin|verificarOrigem|origem", True),
    ("Senha/token em console.log (não deve existir)",
     r"console\.log\([^)]*(senha|password|token)", False),
]

GITIGNORE_ESPERADO = [".env", "node_modules", "generated"]
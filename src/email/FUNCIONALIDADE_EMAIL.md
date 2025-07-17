# 🔐 Segurança e Monitoramento de Acesso

Funcionalidade responsável por proteger o sistema contra acessos indevidos, implementando monitoramento de tentativas de login, bloqueio automático de conta e recuperação segura de senha via e-mail.

---

## 🎯 Funcionalidades

### 🚫 Bloqueio Automático de Conta
- **Comportamento**: Após **3 tentativas falhas de login**, a conta do usuário é automaticamente **bloqueada por 15 minutos**.
- **Notificação**: Um **e-mail de aviso** é enviado ao usuário informando sobre o bloqueio e o tempo de espera.
- **Desbloqueio automático**: Após o tempo de bloqueio, o usuário pode tentar novamente.

### 📩 Recuperação de Senha por E-mail
- Funcionalidade **"Esqueci minha senha"** disponível via endpoint.
- Envia um **código de verificação por e-mail** com tempo de expiração.
- Código é obrigatório para redefinir a senha com segurança.

---

### **Variáveis de Ambiente**
```bash
# .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email-here
EMAIL_PASSWORD=-your-app-password-here
EMAIL_FROM="ForRocketLab Support <suporte@forrocketlab.com>"
```
- **Obs**.: O EMAIL_PASSWORD não é a sua senha do email, e sim uma senha de app criada na sua conta Google.
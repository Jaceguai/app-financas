# Build e Deploy - Financas App

## Pré-requisitos

1. Conta no Expo (https://expo.dev)
2. EAS CLI instalado globalmente:
```bash
npm install -g eas-cli
```

## Configuração Inicial

1. Login no EAS:
```bash
eas login
```

2. Configurar o projeto:
```bash
eas build:configure
```

## Build para Android

### Build de Desenvolvimento (APK)
```bash
eas build --platform android --profile development
```

### Build de Preview (APK para testes)
```bash
eas build --platform android --profile preview
```

### Build de Produção (AAB para Google Play)
```bash
eas build --platform android --profile production
```

## Build para iOS

### Build de Desenvolvimento
```bash
eas build --platform ios --profile development
```

### Build de Preview (para TestFlight)
```bash
eas build --platform ios --profile preview
```

### Build de Produção (para App Store)
```bash
eas build --platform ios --profile production
```

## Configuração do Google Sheets

Antes de fazer o build de produção, certifique-se de:

1. Criar um Google Apps Script com o código fornecido
2. Publicar como Web App
3. Copiar a URL do Web App
4. Atualizar a URL no arquivo `src/services/api.ts`:

```typescript
const GOOGLE_SCRIPT_URL = 'SUA_URL_AQUI';
```

## Variáveis de Ambiente

Para builds de produção, considere usar variáveis de ambiente:

1. Criar arquivo `.env`:
```
GOOGLE_SCRIPT_URL=sua_url_aqui
```

2. Instalar dotenv:
```bash
npm install react-native-dotenv
```

3. Configurar no `babel.config.js`

## Testando o Build

### Android
Após o build, baixe o APK e instale no dispositivo:
```bash
adb install caminho/para/app.apk
```

### iOS
Use o TestFlight para distribuir para testadores

## Publicação

### Google Play Store
1. Faça o build de produção (AAB)
2. Acesse o Google Play Console
3. Crie um novo app ou versão
4. Faça upload do AAB
5. Preencha as informações necessárias
6. Envie para revisão

### Apple App Store
1. Faça o build de produção
2. Acesse o App Store Connect
3. Crie um novo app ou versão
4. Faça upload via TestFlight
5. Preencha as informações necessárias
6. Envie para revisão

## Troubleshooting

### Erro de certificado Android
```bash
eas credentials
```

### Erro de provisioning iOS
```bash
eas credentials
```

### Build falhou
Verifique os logs no dashboard do Expo: https://expo.dev

## Comandos Úteis

```bash
# Ver status dos builds
eas build:list

# Cancelar um build
eas build:cancel

# Ver detalhes de um build específico
eas build:view [BUILD_ID]

# Limpar cache
eas build:configure --clear-cache
```

## Notas Importantes

- Builds de iOS requerem uma conta Apple Developer ($99/ano)
- Builds de produção podem levar 15-30 minutos
- Mantenha suas credenciais seguras
- Teste sempre em dispositivos reais antes de publicar
- Considere usar OTA updates com `expo-updates` para correções rápidas

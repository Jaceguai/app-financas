// Teste de conectividade de rede
export const testNetworkConnection = async (url: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🌐 Testando conexão com:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Conexão OK - Status:', response.status);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error.message);
    return { 
      success: false, 
      error: error.message || 'Falha na conexão' 
    };
  }
};

export const testSupabaseConnection = async (supabaseUrl: string): Promise<boolean> => {
  console.log('🔍 Testando conectividade com Supabase...');
  
  // Testa a URL base do Supabase
  const result = await testNetworkConnection(supabaseUrl);
  
  if (!result.success) {
    console.error('❌ Não foi possível conectar ao Supabase');
    console.error('Possíveis causas:');
    console.error('1. Emulador/dispositivo sem internet');
    console.error('2. URL do Supabase incorreta no .env');
    console.error('3. Firewall bloqueando conexão');
    console.error('4. Problema de DNS no Android');
    return false;
  }
  
  console.log('✅ Conexão com Supabase OK');
  return true;
};

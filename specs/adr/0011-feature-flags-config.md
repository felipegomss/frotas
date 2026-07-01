# ADR 0011 - Feature flags via config (env agora, tabela depois)
Aceito. Estágio atual (MVP, poucos tenants): flags como booleanos em packages/config, lidos de
variável de ambiente por serviço. Simples, sem dependência nova, cobre "ligar globalmente".
Não cobre "ligar só para o tenant X" nem "ligar sem novo deploy".
Gatilho de migração: quando precisar de flag por tenant OU ligar/desligar sem deploy, promover
para uma tabela `feature_flags` no schema admin (chave, escopo global|tenant, valor, lida com
cache curto pela API). Reversível: a leitura fica atrás de uma porta única (getFlag), então
trocar a fonte (env -> tabela) não toca os pontos de uso.
Alternativa rejeitada por ora: serviço externo (LaunchDarkly/Unleash) — custo e integração
desnecessários na escala atual; reavaliar se o número de flags/tenants crescer muito.

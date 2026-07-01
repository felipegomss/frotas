# Feature flags

## Para que servem aqui
Permitir mergear código incompleto ou arriscado na main (mantendo-a sempre implantável) sem
expô-lo ao usuário, e permitir desligar uma feature problemática em produção sem rollback de
deploy. Ver ADR 0011 para o mecanismo escolhido.

## Ciclo de vida de uma flag
1. CRIAR: nasce OFF por padrão. Nome no padrão `<modulo>_<feature>` em inglês (ex.:
   `abastecimento_deteccao_anomalia`).
2. DESENVOLVER atrás da flag: código novo só executa quando a flag está ON; o caminho
   antigo permanece intacto enquanto isso.
3. LIGAR gradualmente: primeiro em homolog, depois em produção — global ou por tenant,
   conforme o que a flag suporta.
4. REMOVER: depois que 100% ligado e estável por um tempo razoável, a flag é REMOVIDA do
   código (não só desligada) num PR de limpeza. Flag esquecida é dívida técnica e
   superfície de bug (combinação de flags nunca testada).

## Regras
- Toda flag nova tem um responsável e uma razão de existir documentada no PR que a introduziu.
- Flag é para o CAMINHO de código, nunca para dado (não bifurcar schema por causa de flag).
- Nunca usar flag como substituto de autorização/permissão (isso é role/membership, não flag).
- Rollback de INCIDENTE causado por feature nova: preferir desligar a flag a fazer rollback de
  deploy inteiro, quando a causa é isolável à feature.

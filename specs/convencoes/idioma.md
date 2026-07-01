# Convenção de idioma

- Fronteira em PORTUGUÊS: rotas (/frota, /ordens-de-uso), textos de UI, rótulos de relatório.
- Interior em INGLÊS: tabelas e colunas do banco, variáveis, funções, classes, tipos, arquivos.
- Valores técnicos em inglês, rótulo exibido em português. Ex.: role no banco = "driver";
  exibido = "Motorista". status = "available"; exibido = "Disponível".

## A regra é por CAMADA, não por conceito
Um mesmo conceito tem nome PT na fronteira e EN no interior. Só a STRING de rota/rótulo é PT;
todo identificador de código (classe, método, tipo, schema Zod, DTO, arquivo, variável) é EN.

| Item | Correto | Errado |
|------|---------|--------|
| Rota (string) | `@Controller('frota')`, `@Get('prefeituras')` | `@Controller('fleet')` |
| Classe controller | `FleetController` (arquivo `fleet.controller.ts`) | `FrotaController` |
| Método handler | `listPrefectures()` mapeado em `@Get('prefeituras')` | `prefeituras()` |
| Schema/DTO Zod | `Prefecture`, `PrefecturesResponse`, `CreateUsageOrder` | `Prefeitura` |
| Tipo/entidade | `Vehicle`, `ActiveMembership` | `Veiculo` |
| Coluna do banco | `current_mileage` | `quilometragem` |
| Valor técnico | `role = "manager"` | `role = "gestor"` |

Regra prática: se o texto aparece numa URL, numa tela ou num relatório → PT. Se é algo que só
outro trecho de código lê (import, tipo, chamada) → EN, mesmo que o domínio seja bem brasileiro.

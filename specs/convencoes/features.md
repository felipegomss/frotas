# Como quebrar um milestone em features

## Princípios
- Fatia VERTICAL, não horizontal: cada feature entrega um incremento usável ponta a ponta
  (domain -> contracts -> api -> app), não uma camada isolada. "Listar veículos disponíveis"
  é feature; "criar todas as tabelas" não é.
- Pequena: cabe num ciclo curto de construir/testar/revisar e numa spec com poucos critérios
  de aceite. Se não cabe, quebre mais.
- Ordenada por dependência e risco: o que destrava outras features e o que é mais incerto vem antes.
- Walking skeleton primeiro: a primeira feature do milestone é o caminho mais fino que prova a
  stack inteira (ex.: provisionar tenant -> 1 veículo -> listar na tela).
- Cada feature vira uma spec em specs/features/ com critérios de aceite verificáveis (SDD).

## Anti-padrões (carro na frente dos bois)
- Feature que depende de algo de um milestone futuro.
- Fatia horizontal ("só o banco", "só a UI") que não entrega valor sozinha.
- Feature grande demais sem critério de pronto; escopo aberto.

## Saída
Backlog do milestone em specs/features/<Mx>/_backlog.md: lista ORDENADA de features,
cada uma com objetivo em 1 linha + dependência + módulo/EF. Cada item vira depois uma spec própria.

# ADR 0007 - Estado: TanStack Query + Zustand
Aceito. Separa estado de servidor (Query: cache, revalidação, mutação) de estado de cliente
(Zustand: UI). Dado de servidor não vai no Zustand. Redux rejeitado por peso desnecessário.

# EF 01 — Cadastro da frota

Cadastro de veículos: placa, modelo, ano, tipo, secretaria responsável, status,
quilometragem atual, documentos (CRLV, seguro), fotos. Vínculo de responsável pelo veículo
com histórico de troca. Secretarias como unidades organizacionais.
Status do veículo é uma máquina de estados (available, in_use, reserved, in_maintenance,
in_repair, inactive) alimentada pelos demais módulos.

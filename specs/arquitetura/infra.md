# Infraestrutura

## Nuvem: AWS região sa-east-1 (São Paulo)
Motivo: residência de dados no Brasil (LGPD, edital) e certificações.

## Ambientes
- Local: Docker Compose (Postgres, MinIO=S3, LocalStack=SQS/SES, Mailhog, Redis).
- Homologação: enxuta. App Runner (API+web, TLS auto, sem ALB/NAT), RDS micro single-AZ,
  S3, Cognito, SES sandbox, CloudWatch. ~R$300-450/mês. Nunca dado real (só sintético).
- Produção: ECS Fargate + ALB, RDS Postgres Multi-AZ, VPC com subnets privadas, NAT.

## Serviços
Banco: RDS PostgreSQL (Postgres padrão, portável; NÃO Supabase, para evitar lock-in).
Storage: S3 + Object Lock (WORM) para fotos, documentos e trilha imutável.
Auth: Cognito (a decidir vs Auth.js). Filas/cron: SQS + EventBridge Scheduler.
Notificação: SES (e-mail), SNS/Zenvia (SMS), Expo Push. CDN/WAF: CloudFront + WAF.
Observabilidade: CloudWatch (+ Sentry). Segurança: GuardDuty, Security Hub, Config, KMS, Secrets Manager.

## Custo por estágio (estimativa, editável na planilha)
T1 início ~R$1.2k/mês · T2 crescimento ~R$3.6k · T3 consolidado ~R$9.7k · T4 escala ~R$25.8k.
Vilões: NAT Gateway, RDS Multi-AZ, transferência de dados e SMS. AWS fatura em dólar (câmbio pesa).

## IaC
Terraform (modules/ + envs/homolog|prod). Estado remoto em S3 + trava DynamoDB.
plan no PR; apply no merge atrás de aprovação humana.

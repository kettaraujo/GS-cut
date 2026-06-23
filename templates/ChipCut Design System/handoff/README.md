# ChipCut — Login com a marca GoldenSat (código de produção)

Código pronto para colar no seu projeto Django (`chipcut/`). É o mesmo visual
que você aprovou: card centralizado sobre fundo azul-marinho, logo GoldenSat,
detalhe dourado e a faixa da paleta.

## Arquivos
```
handoff/
├── templates/registration/login.html      → substitui o seu login.html
├── static/css/login.additions.css          → cole no fim do seu app.css
└── static/img/logo-goldensat.png           → copie para static/img/
```

## Instalação (3 passos)

**1. Logo** — copie a imagem para a pasta de estáticos:
```
chipcut/static/img/logo-goldensat.png
```

**2. CSS** — cole todo o conteúdo de `login.additions.css` no **final** de
`chipcut/static/css/app.css`. (Ele só adiciona as classes `.cc-login*`; não
altera nada que já existe.)

**3. Template** — substitua `chipcut/templates/registration/login.html` pelo
arquivo fornecido aqui.

Pronto. Rode `python manage.py collectstatic` se estiver em produção.

## Observações
- Usa `{% extends "base.html" %}` e os mesmos campos do Django `AuthenticationForm`
  (`username` / `password` + `{% csrf_token %}`), então o `LoginView` padrão
  continua funcionando sem mudar `views.py` nem `urls.py`.
- O `.cc-login` usa `position: fixed; inset: 0`, então cobre a viewport inteira
  mesmo dentro do `<main class="container py-4">` que o `base.html` aplica a
  usuários não autenticados — **não é preciso mexer no base.html**.
- O `--gs-navy` é igual ao `--chipcut-sidebar-bg` que você já tem. Defini as
  variáveis dourado dentro do próprio CSS para o arquivo ser autocontido; se
  preferir, mova-as para o `:root` do `base.html` junto das outras.
- Mantive o `<input type="hidden" name="next">` para preservar o redirecionamento
  pós-login do Django.

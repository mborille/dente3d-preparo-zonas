# Dente 3D com Preparo por Zonas (dente3d-preparo-zonas)

Dente 3D que gira com o mouse ou o dedo. Para cada terço da face vestibular (cervical, médio e incisal) você informa a espessura de esmalte e o desgaste, e o app mostra o esmalte que sobra, a dentina exposta e a espessura final da cerâmica, no modelo 3D e em um corte lateral. Funciona com incisivo central, incisivo lateral e canino superiores. Tudo no navegador, sem enviar dados a servidor.

## Arquivos

- `dente3d-preparo-zonas.html`: app de um arquivo só. Abra no navegador (computador ou celular).
- `nucleo/modelo.js`: perfis do dente, geração da malha 3D, perfil do corte e avaliação por zona, em JavaScript puro.
- `nucleo/teste_modelo.js`: 24 testes. Rode com `node teste_modelo.js` dentro da pasta `nucleo`.

## Regras do cálculo

- Cerâmica = desgaste + acréscimo do mock-up.
- Esmalte restante = esmalte inicial menos desgaste. Se o desgaste passa do esmalte, a diferença é dentina exposta.
- Verde quando sobra pelo menos 30% do esmalte, amarelo quando sobra menos, vermelho quando há dentina exposta.
- O desgaste varia de forma suave entre as zonas no 3D. A tabela mostra o valor de cada zona.
- A redução incisal encurta a borda no modelo e no corte.

## Limites (declarar em qualquer uso)

- O dente é um modelo paramétrico genérico, feito por perfis e seções arredondadas. Cada dente real tem formato, inclinação e espessuras próprias.
- Os valores iniciais de esmalte e desgaste são ilustrativos. Use a medida do caso (guia de silicone, sondagem, tomografia).
- O corte é esquemático, no plano mesiodistal central, e desenha o esmalte lingual com o mesmo valor só para ilustrar.
- O app não indica a quantidade correta de desgaste. Ele calcula as consequências dos números informados.
- Ferramenta de estudo, sem validação clínica.

## Licença

MIT. Veja `LICENSE`.

## Como citar

Veja `CITATION.cff`.

DOI: https://doi.org/10.6084/m9.figshare.34717218

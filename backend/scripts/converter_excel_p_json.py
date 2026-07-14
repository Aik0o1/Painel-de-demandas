"""
Conversor XLSX -> JSON
Uso: python converter_excel_p_json.py arquivo.xlsx
     python converter_excel_p_json.py arquivo.xlsx saida.json  (opcional: nome do arquivo de saída)

O conversor localiza os blocos de dados pelo texto dos cabeçalhos (âncoras), em vez de
índices fixos de linha/coluna. Isso é necessário porque cada planilha mensal tem um número
variável de linhas por bloco (mais ou menos analistas, atendentes etc.), então usar
`range()` fixo quebra a leitura assim que a lista de um mês tem um tamanho diferente do mês
usado para escrever o script originalmente.
"""

import sys
import json
import datetime as dt
import pandas as pd
from pathlib import Path

MES_DISPLAY = {
    "JANEIRO": "Janeiro", "FEVEREIRO": "Fevereiro", "MARCO": "Março", "MARÇO": "Março",
    "ABRIL": "Abril", "MAIO": "Maio", "JUNHO": "Junho", "JULHO": "Julho",
    "AGOSTO": "Agosto", "SETEMBRO": "Setembro", "OUTUBRO": "Outubro",
    "NOVEMBRO": "Novembro", "DEZEMBRO": "Dezembro"
}


# ----------------------------------------------------------------------
# Helpers de leitura segura
# ----------------------------------------------------------------------

def safe_int(val):
    try:
        if pd.isna(val):
            return 0
        return int(val)
    except (ValueError, TypeError):
        return 0


def safe_str(val):
    if pd.isna(val):
        return ""
    return str(val).strip()


def format_duration(val):
    """Normaliza células de duração (timedelta/time/string) para o formato HH:MM:SS."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ""
    if isinstance(val, (pd.Timedelta, dt.timedelta)):
        total_seconds = int(val.total_seconds())
        sign = "-" if total_seconds < 0 else ""
        total_seconds = abs(total_seconds)
        h, rem = divmod(total_seconds, 3600)
        m, s = divmod(rem, 60)
        return f"{sign}{h:02d}:{m:02d}:{s:02d}"
    if isinstance(val, dt.time):
        return f"{val.hour:02d}:{val.minute:02d}:{val.second:02d}"
    return safe_str(val)


def normalize_key(label):
    return safe_str(label).upper().replace(" ", "_")


def is_blank(val):
    return pd.isna(val) or safe_str(val) == ""


def row_text(df, row_idx):
    return " ".join(safe_str(c) for c in df.iloc[row_idx].tolist()).upper()


def find_header_row(df, keywords, start=0, end=None):
    """Retorna o índice da primeira linha (a partir de `start`) que contém todas as
    palavras-chave em qualquer coluna. -1 se não encontrar."""
    end = len(df) if end is None else end
    keywords_upper = [k.upper() for k in keywords]
    for i in range(start, end):
        text = row_text(df, i)
        if all(k in text for k in keywords_upper):
            return i
    return -1


def find_col(df, row_idx, keyword, start_col=0):
    """Retorna o índice da primeira coluna (a partir de `start_col`) cujo texto contém
    a palavra-chave, na linha `row_idx`. -1 se não encontrar."""
    if row_idx < 0:
        return -1
    row = df.iloc[row_idx]
    kw = keyword.upper()
    for col_idx in range(start_col, len(row)):
        if kw in safe_str(row.iloc[col_idx]).upper():
            return col_idx
    return -1


def read_block(df, start_row, cols, stop_col, stop_value="TOTAL", include_stop=False, blank_col=None):
    """Lê linhas a partir de `start_row` até encontrar uma linha em branco (coluna
    `blank_col`) ou até a coluna `stop_col` bater com `stop_value` (ex: "TOTAL").

    cols: lista de tuplas (chave, coluna, função_de_conversão)
    Retorna (lista_de_dicts, próxima_linha_não_consumida).
    """
    if blank_col is None:
        blank_col = cols[0][1]
    rows = []
    i = start_row
    n = len(df)
    while i < n:
        if is_blank(df.iloc[i, blank_col]):
            break
        label_val = safe_str(df.iloc[i, stop_col]).upper()
        is_stop = stop_value is not None and label_val == stop_value.upper()
        if is_stop and not include_stop:
            break
        entry = {key: caster(df.iloc[i, col]) for key, col, caster in cols}
        rows.append(entry)
        i += 1
        if is_stop and include_stop:
            break
    return rows, i


# ----------------------------------------------------------------------
# Aba "<MÊS>-ANALISE"
# ----------------------------------------------------------------------

def parse_mes_analise(df):
    h1 = find_header_row(df, ["USUÁRIO", "QUANTIDADE"])
    usuarios_qtd, next_i = read_block(
        df, h1 + 1,
        cols=[("usuario", 0, safe_str), ("quantidade", 1, safe_int)],
        stop_col=0, stop_value="TOTAL", include_stop=False
    )

    h2 = find_header_row(df, ["PROCESSOS", "QUANTIDADE"], start=next_i)
    processos_totais, next_i = read_block(
        df, h2 + 1,
        cols=[("processo", 1, safe_str), ("quantidade", 2, safe_int)],
        stop_col=1, stop_value="TOTAL", include_stop=True
    )

    h3 = find_header_row(df, ["PROCESSOS", "QUANTIDADE"], start=next_i)
    processos_sem_def, next_i = read_block(
        df, h3 + 1,
        cols=[("processo", 1, safe_str), ("quantidade", 2, safe_int)],
        stop_col=1, stop_value="TOTAL", include_stop=True
    )

    h4 = find_header_row(df, ["USUÁRIO", "EXIGÊNCIA", "DEFERIDOS"], start=next_i)
    usuarios_detalhe, _ = read_block(
        df, h4 + 1,
        cols=[
            ("usuario", 0, safe_str),
            ("exigencia", 1, safe_int),
            ("deferidos", 2, safe_int),
            ("quantidade", 3, safe_int),
        ],
        stop_col=0, stop_value="TOTAL", include_stop=False
    )

    return {
        "ranking_usuarios_por_quantidade": usuarios_qtd,
        "processos_totais_incluindo_deferimento_automatico": processos_totais,
        "processos_sem_deferimento_automatico": processos_sem_def,
        "detalhe_por_usuario": usuarios_detalhe
    }


# ----------------------------------------------------------------------
# Aba "ANALISE GERAL"
# ----------------------------------------------------------------------

def parse_analise_geral(df):
    # Atualizações por usuário
    header_row = find_header_row(df, ["USUÁRIO", "ATUALIZADAS", "REJEITADAS"])
    atualizacoes, _ = read_block(
        df, header_row + 1,
        cols=[
            ("usuario", 0, safe_str),
            ("atualizadas", 1, safe_int),
            ("rejeitadas", 2, safe_int),
            ("total", 3, safe_int),
        ],
        stop_col=0, stop_value="TOTAL", include_stop=False
    )

    # Empresas ativas (linha única de resumo, na mesma linha de cabeçalho acima)
    mei_col = find_col(df, header_row, "MEI")
    me_col = find_col(df, header_row, "ME", start_col=mei_col + 1)
    demais_col = find_col(df, header_row, "DEMAIS", start_col=me_col + 1)
    epp_col = find_col(df, header_row, "EPP", start_col=demais_col + 1)
    total_col = find_col(df, header_row, "TOTAL", start_col=epp_col + 1)
    data_row = header_row + 1
    empresas_ativas = {
        "MEI": safe_int(df.iloc[data_row, mei_col]),
        "ME": safe_int(df.iloc[data_row, me_col]),
        "DEMAIS": safe_int(df.iloc[data_row, demais_col]),
        "EPP": safe_int(df.iloc[data_row, epp_col]),
        "TOTAL": safe_int(df.iloc[data_row, total_col]),
    }

    # Deferimento automático por porte
    h_porte = find_header_row(df, ["PORTE", "INSCRIÇÃO", "ALTERAÇÃO", "PEDIDO"])
    porte_col = find_col(df, h_porte, "PORTE")
    inscricao_col = find_col(df, h_porte, "INSCRIÇÃO")
    alteracao_col = find_col(df, h_porte, "ALTERAÇÃO")
    pedido_col = find_col(df, h_porte, "PEDIDO")
    porte_rows, _ = read_block(
        df, h_porte + 1,
        cols=[
            ("porte", porte_col, safe_str),
            ("inscricao_empresa", inscricao_col, safe_int),
            ("alteracao", alteracao_col, safe_int),
            ("pedido_baixa", pedido_col, safe_int),
        ],
        stop_col=porte_col, stop_value="TOTAL", include_stop=True
    )
    def_auto_porte = {
        normalize_key(r["porte"]): {
            "inscricao_empresa": r["inscricao_empresa"],
            "alteracao": r["alteracao"],
            "pedido_baixa": r["pedido_baixa"],
        }
        for r in porte_rows
    }

    # Processos por horário
    h_hora = find_header_row(df, ["HORÁRIO", "QUANTIDADE"])
    hora_col = find_col(df, h_hora, "HORÁRIO")
    hora_qtd_col = find_col(df, h_hora, "QUANTIDADE")
    hora_rows, _ = read_block(
        df, h_hora + 1,
        cols=[("hora", hora_col, safe_str), ("quantidade", hora_qtd_col, safe_int)],
        stop_col=hora_col, stop_value="TOTAL", include_stop=False
    )
    horarios = {r["hora"]: r["quantidade"] for r in hora_rows}

    # Média de atualização por usuário (dois blocos com o mesmo cabeçalho)
    h_media1 = find_header_row(df, ["USUÁRIO", "MÉDIA DE ATUALIZAÇÃO", "INDICADOR"])
    u1_col = find_col(df, h_media1, "USUÁRIO")
    m1_col = find_col(df, h_media1, "MÉDIA")
    ind1_col = find_col(df, h_media1, "INDICADOR")
    media_atualizacao, next_i = read_block(
        df, h_media1 + 1,
        cols=[("usuario", u1_col, safe_str), ("media", m1_col, format_duration), ("indicador", ind1_col, safe_str)],
        stop_col=u1_col, stop_value=None, include_stop=False
    )

    h_media2 = find_header_row(df, ["USUÁRIO", "MÉDIA DE ATUALIZAÇÃO", "INDICADOR"], start=next_i)
    u2_col = find_col(df, h_media2, "USUÁRIO")
    m2_col = find_col(df, h_media2, "MÉDIA")
    ind2_col = find_col(df, h_media2, "INDICADOR")
    media_geral, _ = read_block(
        df, h_media2 + 1,
        cols=[("usuario", u2_col, safe_str), ("media", m2_col, format_duration), ("indicador", ind2_col, safe_str)],
        stop_col=u2_col, stop_value=None, include_stop=False
    )

    # Análise de livros (número de analistas varia por mês)
    h_livros = find_header_row(df, ["USUÁRIO", "ANALISADOS", "EXIGÊNCIA"])
    livro_nome_col = find_col(df, h_livros, "USUÁRIO")
    livro_analisados_col = find_col(df, h_livros, "ANALISADOS")
    livro_exigencia_col = find_col(df, h_livros, "EXIGÊNCIA")
    livro_rows, _ = read_block(
        df, h_livros + 1,
        cols=[
            ("nome", livro_nome_col, safe_str),
            ("analisados", livro_analisados_col, safe_int),
            ("exigencia", livro_exigencia_col, safe_int),
        ],
        stop_col=livro_nome_col, stop_value="TOTAL", include_stop=True
    )
    analise_livros = {
        normalize_key(r["nome"]): {"analisados": r["analisados"], "exigencia": r["exigencia"]}
        for r in livro_rows
    }

    # Certidões
    h_cert = find_header_row(df, ["CERTIDÕES", "QUANTIDADE"])
    cert_col = find_col(df, h_cert, "CERTIDÕES")
    cert_qtd_col = find_col(df, h_cert, "QUANTIDADE", start_col=cert_col + 1)
    certidoes, _ = read_block(
        df, h_cert + 1,
        cols=[("certidao", cert_col, safe_str), ("quantidade", cert_qtd_col, safe_int)],
        stop_col=cert_col, stop_value="TOTAL", include_stop=True
    )

    return {
        "atualizacoes_por_usuario": atualizacoes,
        "empresas_ativas": empresas_ativas,
        "deferimento_automatico_por_porte": def_auto_porte,
        "processos_por_horario": horarios,
        "media_atualizacao": media_atualizacao,
        "media_atualizacao_geral": media_geral,
        "analise_livros": analise_livros,
        "certidoes": certidoes
    }


# ----------------------------------------------------------------------
# Aba "TEMPO ANALISTAS - <MÊS>"
# ----------------------------------------------------------------------

def parse_tempo_analistas(df):
    h1 = find_header_row(df, ["JULGAMENTO", "AUTENTICAÇÃO", "ARQUIVAMENTO"])
    tempo_analistas, next_i = read_block(
        df, h1 + 1,
        cols=[
            ("usuario", 0, safe_str),
            ("tempo_medio_julgamento_singular", 1, format_duration),
            ("tempo_medio_autenticacao", 2, format_duration),
            ("tempo_medio_arquivamento", 3, format_duration),
        ],
        stop_col=0, stop_value="TOTAL", include_stop=False
    )

    h2 = find_header_row(df, ["ESCLARECER", "RESPONDIDAS"], start=next_i)
    nome_col = find_col(df, h2, "USUÁRIO")
    esc_col = find_col(df, h2, "ESCLARECER")
    resp_col = find_col(df, h2, "RESPONDIDAS")
    esclarecer_exigencia, _ = read_block(
        df, h2 + 1,
        cols=[
            ("usuario", nome_col, safe_str),
            ("qtd_esclarecer_exigencia", esc_col, safe_int),
            ("qtd_exigencia_respondidas", resp_col, safe_int),
        ],
        stop_col=nome_col, stop_value="TOTAL", include_stop=True
    )

    return {
        "tempo_por_analista": tempo_analistas,
        "esclarecer_exigencia": esclarecer_exigencia
    }


# ----------------------------------------------------------------------
# Aba "MÉDIA TEMPO GERAL"
# ----------------------------------------------------------------------

def parse_media_tempo_geral(df):
    return {
        "colegiado": format_duration(df.iloc[2, 1]),
        "parecer_juridico": format_duration(df.iloc[2, 2]),
        "parecer_suporte": format_duration(df.iloc[2, 3]),
        "esclarecer_exigencia": format_duration(df.iloc[2, 4]),
        "julgamento": format_duration(df.iloc[4, 0]),
        "cada_passagem_na_junta": format_duration(df.iloc[4, 1]),
        "autenticacao": format_duration(df.iloc[4, 2]),
        "arquivamento": format_duration(df.iloc[4, 3]),
        "em_exigencia": format_duration(df.iloc[4, 4])
    }


# ----------------------------------------------------------------------
# Aba "<MÊS> - CALL CENTER"
# ----------------------------------------------------------------------

def parse_call_center(df):
    header_row = find_header_row(df, ["ATENDENTE", "TOTAL", "ATENDIMENTOS"])

    def group(title_keyword, value_key, caster):
        label_col = find_col(df, 0, title_keyword)
        value_col = label_col + 1
        rows, _ = read_block(
            df, header_row + 1,
            cols=[("atendente", label_col, safe_str), (value_key, value_col, caster)],
            stop_col=label_col, stop_value="TOTAL", include_stop=False
        )
        return rows

    return {
        "email_por_atendente": group("E-MAIL", "total", safe_int),
        "tempo_medio_por_atendente": group("TEMPO MÉDIO", "duracao", format_duration),
        "atendimentos_call_center": group("ATENDIMENTO", "atendimentos", safe_int),
        "duracao_total_call_center": group("DURAÇÃO TOTAL", "duracao", format_duration)
    }


# ----------------------------------------------------------------------
# Aba "EMPRESAS ATIVAS"
# ----------------------------------------------------------------------

def parse_empresas_ativas(df):
    header_row = find_header_row(df, ["MEI", "ME", "DEMAIS", "EPP", "TOTAL"])
    mei_col = find_col(df, header_row, "MEI")
    me_col = find_col(df, header_row, "ME", start_col=mei_col + 1)
    demais_col = find_col(df, header_row, "DEMAIS", start_col=me_col + 1)
    epp_col = find_col(df, header_row, "EPP", start_col=demais_col + 1)
    total_col = find_col(df, header_row, "TOTAL", start_col=epp_col + 1)
    data_row = header_row + 1
    return {
        "MEI": safe_int(df.iloc[data_row, mei_col]),
        "ME": safe_int(df.iloc[data_row, me_col]),
        "DEMAIS": safe_int(df.iloc[data_row, demais_col]),
        "EPP": safe_int(df.iloc[data_row, epp_col]),
        "TOTAL": safe_int(df.iloc[data_row, total_col]),
    }


# ----------------------------------------------------------------------
# Resolução das abas / mês de referência
# ----------------------------------------------------------------------

def find_sheet(sheet_names, predicate):
    for name in sheet_names:
        if predicate(name.strip().upper()):
            return name
    return None


def resolve_sheets(sheets):
    names = list(sheets.keys())

    analise_name = find_sheet(names, lambda n: n.endswith("-ANALISE"))
    if not analise_name:
        raise ValueError("Não encontrei a aba principal '<MÊS>-ANALISE' na planilha.")

    mes_raw = analise_name.strip().upper().split("-")[0].strip()

    tempo_name = find_sheet(names, lambda n: n.startswith("TEMPO ANALISTAS"))
    call_center_name = find_sheet(names, lambda n: "CALL CENTER" in n)
    analise_geral_name = find_sheet(names, lambda n: n == "ANALISE GERAL")
    media_tempo_name = find_sheet(names, lambda n: "MÉDIA TEMPO GERAL" in n or "MEDIA TEMPO GERAL" in n)
    empresas_ativas_name = find_sheet(names, lambda n: n == "EMPRESAS ATIVAS")

    missing = [
        label for label, value in [
            ("TEMPO ANALISTAS - <MÊS>", tempo_name),
            ("<MÊS> - CALL CENTER", call_center_name),
            ("ANALISE GERAL", analise_geral_name),
            ("MÉDIA TEMPO GERAL", media_tempo_name),
            ("EMPRESAS ATIVAS", empresas_ativas_name),
        ] if value is None
    ]
    if missing:
        raise ValueError(f"Abas obrigatórias não encontradas: {', '.join(missing)}")

    return {
        "mes_raw": mes_raw,
        "analise": analise_name,
        "tempo": tempo_name,
        "call_center": call_center_name,
        "analise_geral": analise_geral_name,
        "media_tempo_geral": media_tempo_name,
        "empresas_ativas": empresas_ativas_name,
    }


def converter(input_path, output_path):
    print(f"Lendo: {input_path}")
    sheets = pd.read_excel(input_path, sheet_name=None, header=None)
    resolved = resolve_sheets(sheets)

    mes_raw = resolved["mes_raw"]
    mes_referencia = MES_DISPLAY.get(mes_raw, mes_raw.capitalize())
    chave_mes = f"{mes_raw.lower()}_analise"

    result = {
        "mes_referencia": mes_referencia,
        chave_mes: parse_mes_analise(sheets[resolved["analise"]]),
        "analise_geral": parse_analise_geral(sheets[resolved["analise_geral"]]),
        "tempo_analistas": parse_tempo_analistas(sheets[resolved["tempo"]]),
        "media_tempo_geral": parse_media_tempo_geral(sheets[resolved["media_tempo_geral"]]),
        "call_center": parse_call_center(sheets[resolved["call_center"]]),
        "empresas_ativas": parse_empresas_ativas(sheets[resolved["empresas_ativas"]])
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"JSON salvo em: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python converter_excel_p_json.py arquivo.xlsx [saida.json]")
        sys.exit(1)

    input_path = Path(sys.argv[1])

    if not input_path.exists():
        print(f"Erro: arquivo '{input_path}' não encontrado.")
        sys.exit(1)

    if len(sys.argv) >= 3:
        output_path = Path(sys.argv[2])
    else:
        output_path = input_path.with_suffix(".json")

    converter(input_path, output_path)

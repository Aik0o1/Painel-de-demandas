#!/usr/bin/env python3
"""
Gerador de Relatorio de Produtividade - JUCEPI
Le um JSON no formato padrao e gera um PDF com tabelas e graficos.
Uso: python gerar_relatorio.py <arquivo.json> [saida.pdf]
"""

import json
import sys
import os
import io
from datetime import datetime

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from PIL import Image as PILImage
import calendar
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable
)

# ── Paleta de cores JUCEPI ──────────────────────────────────────────────────
AZUL_ESCURO = colors.HexColor("#003366")
AZUL_MEDIO  = colors.HexColor("#0066CC")
AZUL_CLARO  = colors.HexColor("#5B9BD5")
CINZA_CLARO = colors.HexColor("#F2F2F2")
CINZA_MEDIO = colors.HexColor("#D9D9D9")
BRANCO      = colors.white

PAGE_W, PAGE_H = A4
MARGIN   = 1.8 * cm
USABLE_W = PAGE_W - 2 * MARGIN

# ── Estilos de texto ────────────────────────────────────────────────────────
STYLE_SECTION = ParagraphStyle(
    "secao", fontSize=11, fontName="Helvetica-Bold",
    textColor=colors.black, alignment=TA_CENTER, spaceAfter=4
)
STYLE_SUBTITLE = ParagraphStyle(
    "subtitulo", fontSize=11, fontName="Helvetica-Bold",
    textColor=AZUL_ESCURO, alignment=TA_CENTER, spaceAfter=4, spaceBefore=8
)

# ─────────────────────────────────────────────────────────────────────────────
#  HELPERS DE GRAFICO
# ─────────────────────────────────────────────────────────────────────────────

def _fig_to_image(fig, width_cm=17, aspect=0.42):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    w = width_cm * cm
    img = Image(buf, width=w, height=w * aspect)
    img.hAlign = "CENTER"
    return img


def formatar_tempo_total(v):
    """Converte '1 day, 16:01:11.448000' para '40:01:11'."""
    if not v or v == "-":
        return "-"
    s = str(v).strip()
    if not s or s == "None":
        return "-"
    
    # Se tiver microsegundos ".123456", remove
    if "." in s:
        s = s.split(".")[0]
        
    if "day" not in s:
        return s

    try:
        # Exemplo: "1 day, 16:01:11" ou "2 days, 05:10:00"
        partes = s.split(",")
        dias_part = partes[0].strip().split(" ")
        dias = int(dias_part[0])
        
        tempo_str = partes[1].strip()
        h_m_s = tempo_str.split(":")
        
        horas = int(h_m_s[0])
        minutos = h_m_s[1]
        segundos = h_m_s[2]
        
        total_horas = (dias * 24) + horas
        return f"{total_horas:02}:{minutos}:{segundos}"
    except:
        return s


def grafico_barra_horizontal(labels, valores, titulo, cor="#5B9BD5", width_cm=17):
    n = len(labels)
    fig_h = max(4, n * 0.52)
    fig, ax = plt.subplots(figsize=(11, fig_h))
    y = np.arange(n)
    bars = ax.barh(y, valores, color=cor, height=0.6)
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=11)
    ax.invert_yaxis()
    ax.set_title(titulo, fontsize=13, fontweight="bold", color="#003366", pad=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False, labelsize=11)
    ax.set_xlim(0, max(valores) * 1.18) if valores else ax.set_xlim(0, 1)
    for bar, val in zip(bars, valores):
        ax.text(val + (max(valores) * 0.012 if valores else 0), bar.get_y() + bar.get_height() / 2,
                str(val), va="center", fontsize=11, fontweight="bold", color="#333333")
    fig.tight_layout()
    return _fig_to_image(fig, width_cm, aspect=fig_h / 11)


def grafico_barra_horizontal_compact(labels, valores, titulo, cor="#5B9BD5", width_cm=17, altura_por_item=0.35):
    """Versao compacta para caber na mesma pagina que a tabela."""
    n = len(labels)
    fig_h = max(3, n * altura_por_item)
    fig, ax = plt.subplots(figsize=(11, fig_h))
    y = np.arange(n)
    bars = ax.barh(y, valores, color=cor, height=0.55)
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=9)
    ax.invert_yaxis()
    ax.set_title(titulo, fontsize=11, fontweight="bold", color="#003366", pad=6)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False, labelsize=9)
    ax.set_xlim(0, max(valores) * 1.15) if valores else ax.set_xlim(0, 1)
    for bar, val in zip(bars, valores):
        ax.text(val + (max(valores) * 0.01 if valores else 0), bar.get_y() + bar.get_height() / 2,
                str(val), va="center", fontsize=9, fontweight="bold", color="#333333")
    fig.tight_layout(pad=0.5)
    return _fig_to_image(fig, width_cm, aspect=fig_h / 11)


def grafico_barra_vertical(labels, valores, titulo, cores=None, width_cm=15):
    fig, ax = plt.subplots(figsize=(9, 4.5))
    x = np.arange(len(labels))
    if cores is None:
        cores = ["#5B9BD5"] * len(labels)
    bars = ax.bar(x, valores, color=cores, width=0.5)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=11, rotation=15, ha="right")
    ax.set_title(titulo, fontsize=13, fontweight="bold", color="#003366", pad=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(labelsize=11)
    for bar, val in zip(bars, valores):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + (max(valores) * 0.012 if valores else 0),
                f"{val:,}".replace(",", "."),
                ha="center", fontsize=10, fontweight="bold")
    fig.tight_layout()
    return _fig_to_image(fig, width_cm, aspect=0.48)


def grafico_linha_horario(horarios, quantidades, width_cm=17):
    fig, ax = plt.subplots(figsize=(13, 3.2))
    horas = [h.split(":")[0] + "h" for h in horarios]
    ax.fill_between(range(len(horas)), quantidades, alpha=0.2, color="#5B9BD5")
    ax.plot(range(len(horas)), quantidades, marker="o", markersize=5,
            color="#003366", linewidth=2)
    ax.set_xticks(range(len(horas)))
    ax.set_xticklabels(horas, fontsize=10, rotation=45)
    ax.set_title("Horario de Maior Indice de Protocolos no Sistema",
                 fontsize=13, fontweight="bold", color="#003366", pad=10)
    ax.tick_params(labelsize=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    return _fig_to_image(fig, width_cm, aspect=0.27)


# ─────────────────────────────────────────────────────────────────────────────
#  HELPERS DE TABELA
# ─────────────────────────────────────────────────────────────────────────────

def make_table(headers, rows, col_widths=None, highlight_last=True):
    header_row = [Paragraph(f"<b>{h}</b>", ParagraphStyle(
        "th", fontSize=10, fontName="Helvetica-Bold",
        textColor=BRANCO, alignment=TA_CENTER
    )) for h in headers]

    data = [header_row]
    for row in rows:
        data.append([
            Paragraph(str(c), ParagraphStyle(
                "td", fontSize=10, fontName="Helvetica",
                textColor=colors.black,
                alignment=TA_CENTER if j > 0 else TA_LEFT
            )) for j, c in enumerate(row)
        ])

    if col_widths is None:
        col_widths = [USABLE_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), AZUL_ESCURO),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRANCO, CINZA_CLARO]),
        ("GRID", (0, 0), (-1, -1), 0.4, CINZA_MEDIO),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    if highlight_last and len(data) > 1:
        style_cmds += [
            ("BACKGROUND", (0, -1), (-1, -1), AZUL_CLARO),
            ("TEXTCOLOR", (0, -1), (-1, -1), BRANCO),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ]
    t.setStyle(TableStyle(style_cmds))
    return t


def mes_label(data):
    """Extrai o mes e ano do campo _id (formato MM-YYYY ou similar) e retorna ex: 'NOVEMBRO / 2025'"""
    meses_pt = {
        "01": "JANEIRO",  "02": "FEVEREIRO", "03": "MARCO",
        "04": "ABRIL",    "05": "MAIO",       "06": "JUNHO",
        "07": "JULHO",    "08": "AGOSTO",     "09": "SETEMBRO",
        "10": "OUTUBRO",  "11": "NOVEMBRO",   "12": "DEZEMBRO",
    }
    raw = str(data.get("_id", ""))
    partes = raw.split("-")
    if len(partes) == 2:
        mm, yyyy = partes[0].zfill(2), partes[1]
        return f"{meses_pt.get(mm, mm)} / {yyyy}"
    return raw.upper()


def sec_hdr(text):
    return Paragraph(text, STYLE_SECTION)

def sub_hdr(text):
    return Paragraph(f"<b>{text}</b>", STYLE_SUBTITLE)

def sp(h=0.25):
    return Spacer(1, h * cm)


# ─────────────────────────────────────────────────────────────────────────────
#  SECOES
# ─────────────────────────────────────────────────────────────────────────────

# PAG 2: Produtividade analise — tabela grande + grafico
def sec_produtividade_analise(data, story, mes):
    story.append(sec_hdr(f"RELATORIO PRODUTIVIDADE - ANALISE"))
    story.append(sp())

    chave = next((k for k in data if k.endswith("_analise") and k != "analise_geral"), None)
    if not chave:
        return
    detalhe = data[chave]["detalhe_por_usuario"]
    rows = [[d["usuario"], d["exigencia"], d["deferidos"], d["quantidade"]] for d in detalhe]
    rows.append(["TOTAL",
                 sum(d["exigencia"]  for d in detalhe),
                 sum(d["deferidos"]  for d in detalhe),
                 sum(d["quantidade"] for d in detalhe)])

    cw = [USABLE_W - 5.4*cm, 1.8*cm, 1.8*cm, 1.8*cm]
    story.append(make_table(["USUARIO", "EXIGENCIA", "DEFERIDOS", "QUANTIDADE"],
                            rows, col_widths=cw))
    story.append(sp())

    pares = sorted(zip([d["usuario"] for d in detalhe], [d["quantidade"] for d in detalhe]),
                   key=lambda x: x[1], reverse=True)
    labels_ord  = [p[0] for p in pares]
    valores_ord = [p[1] for p in pares]
    story.append(grafico_barra_horizontal_compact(labels_ord, valores_ord, "PRODUTIVIDADE ANALISE"))
    story.append(PageBreak())


# PAG 3: Status + Deferimento automatico + Exigencias por analista (igual imagem de referencia)
def sec_status_deferimento_exigencias(data, story, mes):
    # Status de processos
    story.append(sec_hdr("STATUS DE PROCESSOS (COM DEFERIMENTO AUTOMATICO)"))
    story.append(sp())
    chave = next((k for k in data if k.endswith("_analise") and k != "analise_geral"), None)
    if not chave:
        return
    processos = data[chave]["processos_totais_incluindo_deferimento_automatico"]
    rows = [[p["processo"], f"{p['quantidade']:,}".replace(",", ".")] for p in processos]
    story.append(make_table(["PROCESSOS", "QUANTIDADE"], rows,
                            col_widths=[USABLE_W - 3*cm, 3*cm]))
    story.append(sp())

    # Deferimento automatico
    story.append(sec_hdr("DEFERIMENTO AUTOMATICO"))
    story.append(sp(0.15))

    # Linha resumo total
    story.append(sub_hdr("DEFERIMENTO AUTOMATICO"))
    da = data["analise_geral"].get("deferimento_automatico_por_porte", {})
    tot = da.get("TOTAL", {"inscricao_empresa": 0, "alteracao": 0, "pedido_baixa": 0})
    story.append(make_table(
        ["INSCRICAO DE EMPRESA", "ALTERACAO", "PEDIDO DE BAIXA", "TOTAL"],
        [[tot["inscricao_empresa"], tot["alteracao"], tot["pedido_baixa"],
          tot["inscricao_empresa"] + tot["alteracao"] + tot["pedido_baixa"]]],
        col_widths=[USABLE_W / 4] * 4, highlight_last=False))
    story.append(sp(0.2))

    # Tabela por porte
    rows2 = [[porte,
              da.get(porte, {}).get("inscricao_empresa", 0),
              da.get(porte, {}).get("alteracao", 0),
              da.get(porte, {}).get("pedido_baixa", 0)]
             for porte in ["DEMAIS", "EPP", "ME", "TOTAL"]]
    story.append(make_table(["PORTE", "INSCRICAO DE EMPRESA", "ALTERACAO", "PEDIDO DE BAIXA"],
                            rows2, col_widths=[USABLE_W / 4] * 4))
    story.append(sp())

    # Exigencias por analista
    story.append(sec_hdr("EXIGENCIAS POR ANALISTA"))
    story.append(sp())
    ex = data.get("tempo_analistas", {}).get("esclarecer_exigencia", [])
    rows3 = [[e.get("usuario", ""), e.get("qtd_esclarecer_exigencia", 0), e.get("qtd_exigencia_respondidas", 0)]
             for e in ex]
    story.append(make_table(
        ["NOME USUARIO", "QTD ESCLARECER EXIGENCIA", "QTD EXIGENCIA RESPONDIDAS"],
        rows3, col_widths=[USABLE_W - 7*cm, 3.5*cm, 3.5*cm]))
    story.append(PageBreak())


# PAG 4: Tempo geral por analista
def sec_tempo_geral_analista(data, story, mes):
    story.append(sec_hdr("TEMPO GERAL POR ANALISTA"))
    story.append(sp())

    analistas = data.get("tempo_analistas", {}).get("tempo_por_analista", [])

    rows = [[a.get("usuario", ""),
             formatar_tempo_total(a.get("tempo_medio_julgamento_singular")),
             formatar_tempo_total(a.get("tempo_medio_autenticacao")),
             formatar_tempo_total(a.get("tempo_medio_arquivamento"))]
            for a in analistas]

    cw = [USABLE_W - 9*cm, 3*cm, 3*cm, 3*cm]
    story.append(make_table(
        ["NOME USUARIO", "Tempo Medio Julgamento Singular",
         "Tempo Medio Autenticacao", "Tempo Medio Arquivamento"],
        rows, col_widths=cw, highlight_last=False))
    story.append(PageBreak())


# PAG 5: Media de tempo geral
def sec_media_tempo_geral(data, story, mes):
    story.append(sec_hdr("MEDIA DE TEMPO GERAL"))
    story.append(sp())

    mg = data.get("media_tempo_geral", {})

    story.append(make_table(
        ["Julgamento", "Colegiado", "Parecer Juridico", "Parecer Suporte", "Esclarecer Exigencia"],
        [[formatar_tempo_total(mg.get("julgamento")), 
          formatar_tempo_total(mg.get("colegiado")), 
          formatar_tempo_total(mg.get("parecer_juridico")),
          formatar_tempo_total(mg.get("parecer_suporte")), 
          formatar_tempo_total(mg.get("esclarecer_exigencia"))]],
        col_widths=[USABLE_W / 5] * 5, highlight_last=False))
    story.append(sp(0.2))
    story.append(make_table(
        ["Cada Passagem na Junta", "Autenticacao", "Arquivamento", "Em Exigencia"],
        [[formatar_tempo_total(mg.get("cada_passagem_na_junta")), 
          formatar_tempo_total(mg.get("autenticacao")),
          formatar_tempo_total(mg.get("arquivamento")), 
          formatar_tempo_total(mg.get("em_exigencia"))]],
        col_widths=[USABLE_W / 4] * 4, highlight_last=False))
    story.append(sp())


# continua na mesma pagina: Certidoes
def sec_certidoes(data, story, mes):
    story.append(sec_hdr(f"CERTIDOES - {mes}"))
    story.append(sp())

    certs_raw = data["analise_geral"].get("certidoes", [])
    total_cert = next((c for c in certs_raw if c.get("certidao") == "TOTAL"), {"certidao": "TOTAL", "quantidade": 0})
    certs = sorted([c for c in certs_raw if c.get("certidao") != "TOTAL"],
                   key=lambda x: x.get("quantidade", 0), reverse=True)
    rows = [[c["certidao"], f"{c['quantidade']:,}".replace(",", ".")] for c in certs]
    rows.append([total_cert["certidao"], f"{total_cert['quantidade']:,}".replace(",", ".")])
    story.append(make_table(["CERTIDOES", "QUANTIDADE"], rows,
                            col_widths=[USABLE_W - 2.5*cm, 2.5*cm]))
    story.append(sp())

    nomes = [c["certidao"] for c in certs]
    vals  = [c["quantidade"] for c in certs]
    story.append(grafico_barra_horizontal_compact(nomes, vals, f"CERTIDOES - {mes}", altura_por_item=0.5))
    story.append(PageBreak())


# PAG 7: Livros + Atualizacao cadastral + Media — tudo junto
def sec_livros_atualizacao(data, story, mes):
    story.append(sec_hdr(f"LIVROS - {mes}"))
    story.append(sp())

    story.append(sub_hdr("ANALISE DE LIVROS"))
    livros = data.get("analise_geral", {}).get("analise_livros", {})
    def lst(key):
        return livros.get(key, {"analisados": 0, "exigencia": 0})
    rows_l = [
        ["GELZUITA",
         lst("GELZUITA").get("analisados", 0),
         lst("GELZUITA").get("exigencia", 0)],
        ["DEFERIMENTO AUTOMATICO",
         lst("DEFERIMENTO_AUTOMATICO").get("analisados", 0),
         lst("DEFERIMENTO_AUTOMATICO").get("exigencia", 0)],
        ["TOTAL",
         lst("TOTAL").get("analisados", 0),
         lst("TOTAL").get("exigencia", 0)],
    ]
    story.append(make_table(["USUARIO", "ANALISADOS", "EXIGENCIA"],
                            rows_l, col_widths=[USABLE_W / 3] * 3))
    story.append(sp())

    story.append(sub_hdr("ATUALIZACAO CADASTRAL"))
    atu = data.get("analise_geral", {}).get("atualizacoes_por_usuario", [])
    rows_a = [[a.get("usuario", ""), a.get("atualizadas", 0), a.get("rejeitadas", 0), a.get("total", 0)] for a in atu]
    rows_a.append(["TOTAL",
                   sum(a.get("atualizadas", 0) for a in atu),
                   sum(a.get("rejeitadas", 0)  for a in atu),
                   sum(a.get("total", 0)       for a in atu)])
    cw2 = [USABLE_W - 7.5*cm, 2.5*cm, 2.5*cm, 2.5*cm]
    story.append(make_table(["USUARIO", "ATUALIZADAS", "REJEITADAS", "TOTAL"],
                            rows_a, col_widths=cw2))
    story.append(sp())

    story.append(sub_hdr("MEDIA DE TEMPO - ATUALIZACAO CADASTRAL"))
    med = data.get("analise_geral", {}).get("media_atualizacao", [])

    def conv_estrelas(ind):
        count = str(ind).count("⭐")
        return "★" * count if count else str(ind)

    rows_m = [[m.get("usuario", ""), formatar_tempo_total(m.get("media")), conv_estrelas(m.get("indicador", ""))] for m in med]
    cw3 = [USABLE_W - 6.5*cm, 4*cm, 2.5*cm]
    story.append(make_table(["USUARIO", "MEDIA DE ATUALIZACAO", "INDICADOR"],
                            rows_m, col_widths=cw3, highlight_last=False))
    story.append(PageBreak())


# PAG 8: Horarios — tabela + grafico
def sec_horarios(data, story, mes):
    story.append(sec_hdr("HORARIO DE MAIOR INDICE DE PROTOCOLOS NO SISTEMA"))
    story.append(sp())

    hp = data["analise_geral"].get("processos_por_horario", {})
    sorted_h    = sorted(hp.items(), key=lambda x: x[1], reverse=True)
    horarios    = [h for h, _ in sorted_h]
    quantidades = [q for _, q in sorted_h]
    total       = sum(quantidades)
    max_q       = quantidades[0] if quantidades else 1

    def qty_color(q):
        ratio = q / max_q
        if ratio >= 0.5:
            t = (ratio - 0.5) / 0.5
            r = 255
            g = int((1 - t) * 220)
            b = 0
        else:
            t = ratio / 0.5
            r = int(t * 220)
            g = int(180 + t * 40)
            b = 0
        return colors.Color(r/255, g/255, b/255)

    from reportlab.platypus import TableStyle as TS
    header_row = [
        Paragraph("<b>HORARIO</b>", ParagraphStyle("th2", fontSize=10, fontName="Helvetica-Bold", textColor=BRANCO, alignment=TA_CENTER)),
        Paragraph("<b>QUANTIDADE</b>", ParagraphStyle("th2b", fontSize=10, fontName="Helvetica-Bold", textColor=BRANCO, alignment=TA_CENTER)),
    ]
    data_rows = [header_row]
    for h, q in sorted_h:
        data_rows.append([
            Paragraph(h, ParagraphStyle("td2", fontSize=10, fontName="Helvetica", textColor=colors.black, alignment=TA_CENTER)),
            Paragraph(str(q), ParagraphStyle("td2b", fontSize=10, fontName="Helvetica", textColor=colors.black, alignment=TA_CENTER)),
        ])
    data_rows.append([
        Paragraph("<b>TOTAL</b>", ParagraphStyle("tot2", fontSize=10, fontName="Helvetica-Bold", textColor=BRANCO, alignment=TA_CENTER)),
        Paragraph(f"<b>{total}</b>", ParagraphStyle("tot2b", fontSize=10, fontName="Helvetica-Bold", textColor=BRANCO, alignment=TA_CENTER)),
    ])

    cw = [USABLE_W / 2] * 2
    t = Table(data_rows, colWidths=cw, repeatRows=1)

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), AZUL_ESCURO),
        ("GRID", (0, 0), (-1, -1), 0.4, CINZA_MEDIO),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, -1), (-1, -1), AZUL_CLARO),
    ]
    for i, (h, q) in enumerate(sorted_h, start=1):
        style_cmds.append(("BACKGROUND", (1, i), (1, i), qty_color(q)))

    t.setStyle(TableStyle(style_cmds))
    story.append(t)
    story.append(sp())
    sorted_cron = sorted(hp.items(), key=lambda x: x[0])
    horarios_cron    = [h for h, _ in sorted_cron]
    quantidades_cron = [q for _, q in sorted_cron]
    story.append(grafico_linha_horario(horarios_cron, quantidades_cron))
    story.append(PageBreak())


# PAG 9: Suporte
def sec_suporte(data, story, mes):
    story.append(sec_hdr(f"RELATORIO PRODUTIVIDADE SUPORTE - {mes}"))
    story.append(sp())

    cc = data.get("call_center", {})
    cw2 = [USABLE_W - 3.5*cm, 3.5*cm]

    # E-MAIL
    story.append(sub_hdr("E-MAIL"))
    email_list = cc.get("email_por_atendente", [])
    rows_e = [[a.get("atendente", ""), a.get("total", 0)] for a in email_list]
    rows_e.append(["TOTAL", sum(a.get("total", 0) for a in email_list)])
    story.append(make_table(["ATENDENTE", "TOTAL"], rows_e, col_widths=cw2))
    story.append(sp())

    # ATENDIMENTO CALL CENTER
    story.append(sub_hdr("ATENDIMENTO CALL CENTER"))
    at_list = cc.get("atendimentos_call_center", [])
    rows_c = [[a.get("atendente", ""), a.get("atendimentos", 0)] for a in at_list]
    rows_c.append(["TOTAL", sum(a.get("atendimentos", 0) for a in at_list)])
    story.append(make_table(["ATENDENTE", "ATENDIMENTOS"], rows_c, col_widths=cw2))
    story.append(sp())

    # TEMPO MEDIO CALL CENTER
    story.append(sub_hdr("TEMPO MEDIO CALL CENTER"))
    tm_list = cc.get("tempo_medio_por_atendente", [])
    rows_t = [[a.get("atendente", ""), a.get("duracao", "00:00:00")] for a in tm_list]
    tot_tm = 0
    for d in tm_list:
        try:
            parts = d.get("duracao", "00:00:00").split(":")
            tot_tm += int(parts[0])*3600 + int(parts[1])*60 + int(parts[2])
        except Exception:
            pass
    rows_t.append(["TOTAL", f"{tot_tm//3600:02d}:{(tot_tm%3600)//60:02d}:{tot_tm%60:02d}"])
    story.append(make_table(["ATENDENTE", "DURACAO"], rows_t, col_widths=cw2))
    story.append(sp())

    # DURACAO TOTAL CALL CENTER — quebra de pagina para garantir que fique junto
    story.append(PageBreak())
    story.append(sub_hdr("DURACAO TOTAL CALL CENTER"))
    dt_list = cc.get("duracao_total_call_center", [])
    rows_d = [[a.get("atendente", ""), a.get("duracao", "00:00:00")] for a in dt_list]
    def _hms(s):
        try:
            p = str(s).split(":")
            return int(p[0])*3600 + int(p[1])*60 + int(p[2])
        except Exception:
            return 0
    tot_d = sum(_hms(a.get("duracao", "00:00:00")) for a in dt_list)
    rows_d.append(["TOTAL", f"{tot_d//3600:02d}:{(tot_d%3600)//60:02d}:{tot_d%60:02d}"])
    story.append(make_table(["ATENDENTE", "DURACAO"], rows_d, col_widths=cw2))
    story.append(PageBreak())


# PAG 10: Empresas ativas — tabela + grafico
def sec_empresas_ativas(data, story, mes):
    story.append(sec_hdr("EMPRESAS ATIVAS"))
    story.append(sp())

    ea = data.get("empresas_ativas", {"MEI":0, "ME":0, "DEMAIS":0, "EPP":0, "TOTAL":0})
    row = [f"{ea.get('MEI', 0):,}".replace(",", "."),
           f"{ea.get('ME', 0):,}".replace(",", "."),
           f"{ea.get('DEMAIS', 0):,}".replace(",", "."),
           f"{ea.get('EPP', 0):,}".replace(",", "."),
           f"{ea.get('TOTAL', 0):,}".replace(",", ".")]
    story.append(make_table(["MEI", "ME", "DEMAIS", "EPP", "TOTAL"], [row],
                            col_widths=[USABLE_W / 5] * 5, highlight_last=False))
    story.append(sp())

    labels = ["MEI", "ME", "DEMAIS", "EPP"]
    vals   = [ea.get("MEI", 0), ea.get("ME", 0), ea.get("DEMAIS", 0), ea.get("EPP", 0)]
    story.append(grafico_barra_vertical(
        labels, vals, "EMPRESAS ATIVAS POR PORTE",
        cores=["#5B9BD5", "#ED7D31", "#A9D18E", "#FFC000"]
    ))


# ─────────────────────────────────────────────────────────────────────────────
#  HEADER / FOOTER
# ─────────────────────────────────────────────────────────────────────────────

# Caminho do papel timbrado (PNG) — altere se necessário
TIMBRADO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "timbrado.png")

def on_page(canvas, doc):
    canvas.saveState()
    # Desenha o papel timbrado como fundo cobrindo a pagina inteira
    if os.path.exists(TIMBRADO_PATH):
        canvas.drawImage(TIMBRADO_PATH, 0, 0, width=PAGE_W, height=PAGE_H,
                         preserveAspectRatio=False, mask="auto")
    # Sobreposicao branca semitransparente — simula opacidade de cabecalho Word (ajuste 0.0-1.0)
    canvas.setFillColorRGB(1, 1, 1, alpha=0.55)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Numero de pagina no rodape
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#333333"))
    canvas.drawRightString(PAGE_W - MARGIN, 0.9*cm, f"Pagina {doc.page}")
    canvas.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
#  CAPA
# ─────────────────────────────────────────────────────────────────────────────

def capa(story, mes):
    story.append(Spacer(1, 5*cm))
    story.append(Paragraph("RELATORIO DE PRODUTIVIDADE",
        ParagraphStyle("c1", fontSize=22, fontName="Helvetica-Bold",
                       textColor=AZUL_ESCURO, alignment=TA_CENTER)))
    story.append(sp(0.4))
    story.append(Paragraph(f"ANALISE - SUPORTE - {mes}",
        ParagraphStyle("c2", fontSize=14, fontName="Helvetica",
                       textColor=AZUL_MEDIO, alignment=TA_CENTER)))
    story.append(sp(0.8))
    story.append(HRFlowable(width=8*cm, thickness=2, color=AZUL_ESCURO, hAlign="CENTER"))
    story.append(sp(0.4))
    story.append(Paragraph(f"Gerado em {datetime.now().strftime('%d/%m/%Y as %H:%M')}",
        ParagraphStyle("c3", fontSize=9, fontName="Helvetica",
                       textColor=colors.grey, alignment=TA_CENTER)))
    story.append(PageBreak())


def gerar_relatorio_from_data(data: dict) -> bytes:
    """Gera o PDF a partir de um dicionário e retorna os bytes (para uso em APIs/Web)."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=3.8*cm, bottomMargin=3.8*cm,
        title="Relatorio de Produtividade - JUCEPI", author="JUCEPI"
    )

    mes = mes_label(data)
    story = []
    capa(story, mes)
    sec_produtividade_analise(data, story, mes)
    sec_status_deferimento_exigencias(data, story, mes)
    sec_tempo_geral_analista(data, story, mes)
    sec_media_tempo_geral(data, story, mes)
    sec_certidoes(data, story, mes)
    sec_livros_atualizacao(data, story, mes)
    sec_horarios(data, story, mes)
    sec_suporte(data, story, mes)
    sec_empresas_ativas(data, story, mes)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def gerar_relatorio(json_path: str, pdf_path: str = None):
    if pdf_path is None:
        base = os.path.splitext(json_path)[0]
        pdf_path = base + "_relatorio.pdf"

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    pdf_bytes = gerar_relatorio_from_data(data)
    
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)

    print(f"Relatorio gerado: {pdf_path}")
    return pdf_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python gerar_relatorio.py <dados.json> [saida.pdf]")
        sys.exit(1)
    gerar_relatorio(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
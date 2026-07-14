"""
Conversor XLSX -> JSON (uso manual via linha de comando)
Uso: python converter_excel_p_json.py arquivo.xlsx
     python converter_excel_p_json.py arquivo.xlsx saida.json  (opcional: nome do arquivo de saída)

A logica de conversao vive em `services/excel_report_converter.py` — este script e so
uma casca de linha de comando em cima dela. O mesmo conversor tambem e usado pelo
endpoint de upload de planilhas em `routes/admin.py`.
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from services.excel_report_converter import converter_para_dict, ExcelReportError


def converter(input_path, output_path):
    print(f"Lendo: {input_path}")
    result = converter_para_dict(input_path)

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

    try:
        converter(input_path, output_path)
    except ExcelReportError as e:
        print(f"Erro: {e}")
        sys.exit(1)

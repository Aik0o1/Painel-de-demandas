import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export async function parseReport(buffer, mimeType) {
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('sheet')) {
        return parseExcelReport(buffer);
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return parseWordReport(buffer);
    } else {
        throw new Error('Formato de arquivo não suportado. Use Excel (.xlsx) ou Word (.docx).');
    }
}

// ----------------------------------------------------------------------
// EXCEL PARSER (Smart Anchoring)
// ----------------------------------------------------------------------
async function parseExcelReport(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of Arrays

    // Initialize Data Structure
    const reportData = initReportData();

    // --- Helper: Find Header Row by multiple keywords ---
    const findHeaderRow = (keywords) => {
        return rawData.findIndex(row =>
            row && Array.isArray(row) && keywords.every(k =>
                row.some(cell => String(cell).toUpperCase().includes(k.toUpperCase()))
            )
        );
    };

    // 1. DATA (Search for Month in first 20 rows)
    const monthMap = { 'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4, 'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8, 'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12 };
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
        const text = (rawData[i] || []).join(' ').toUpperCase();
        if (text.includes('RELATÓRIO') || text.includes('MÊS')) {
            for (const [mName, mNum] of Object.entries(monthMap)) {
                if (text.includes(mName)) { reportData.month = mNum; break; }
            }
        }
    }

    // 2. PRODUTIVIDADE (Anchor: USUÁRIO + DEFERIDOS/EXIGÊNCIA)
    // Avoid "TOTAL" rows or other summaries
    let prodHeaderIdx = findHeaderRow(['USUÁRIO', 'DEFERIDOS']);
    if (prodHeaderIdx === -1) prodHeaderIdx = findHeaderRow(['ANALISTA', 'DEFERIDOS']); // Fallback

    if (prodHeaderIdx > -1) {
        // Map columns dynamically
        const header = rawData[prodHeaderIdx].map(c => String(c).toUpperCase());
        const nameIdx = header.findIndex(c => c.includes('USUÁRIO') || c.includes('ANALISTA'));
        const exigIdx = header.findIndex(c => c.includes('EXIGÊNCIA'));
        const defIdx = header.findIndex(c => c.includes('DEFERIDOS'));
        const totalIdx = header.findIndex(c => c.includes('TOTAL') || c.includes('QTD'));

        for (let i = prodHeaderIdx + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            // Stop at Total line
            const firstCell = String(row[nameIdx] || "").toUpperCase();
            if (firstCell.includes('TOTAL')) break;

            if (row[nameIdx] && nameIdx > -1) {
                // Ensure we have numbers
                const exig = parseInt(row[exigIdx]) || 0;
                const def = parseInt(row[defIdx]) || 0;
                // Total might be calculated or present
                const total = totalIdx > -1 ? (parseInt(row[totalIdx]) || 0) : (exig + def);

                reportData.analyst_stats.push({
                    name: normalizeName(String(row[nameIdx])),
                    exigencia: exig,
                    deferidos: def,
                    total: total
                });
            }
        }
    }

    // 3. FLUXO / DEFERIMENTO AUTOMÁTICO
    // Look for row with "DEFERIMENTO AUTOMÁTICO"
    const autoRowIdx = findHeaderRow(['DEFERIMENTO AUTOMÁTICO']);
    if (autoRowIdx > -1) {
        const row = rawData[autoRowIdx];
        // Usually the number is in the next column or nearby
        const vals = row.filter(c => typeof c === 'number');
        if (vals.length > 0) reportData.process_stats.automatico = vals[0];
    } else {
        // Try finding by text in whole sheet if it's a label-value pair in different columns
        // Simplified for now
    }

    // 4. SUPORTE (Anchor: ATENDENTE + CHAMADOS)
    const supportHeaderIdx = findHeaderRow(['ATENDENTE', 'CHAMADOS']);
    if (supportHeaderIdx > -1) {
        // Logic similar to productivity
        // ...
    }

    // 5. EMPRESAS (Anchor: MEI, ME, EPP)
    // Excel might have these in a summary block
    const companiesIdx = rawData.findIndex(row => row && row.some(c => String(c).includes('EMPRESAS ATIVAS')));
    if (companiesIdx > -1) {
        // Look in subsequent rows
        for (let j = 0; j < 10; j++) {
            const r = rawData[companiesIdx + j];
            if (!r) continue;
            const joins = r.join(' ').toUpperCase();
            // Parse Numbers, removing dots: "141.243" -> 141243
            const extract = (txt, label) => {
                if (txt.includes(label)) {
                    const parts = txt.split(label);
                    const numStr = parts[1].replace(/[^0-9]/g, ''); // Extract digits only
                    return parseInt(numStr) || 0;
                }
                return 0;
            }
            if (joins.includes('MEI')) reportData.active_companies.mei = extract(joins, 'MEI');
            if (joins.includes('EPP')) reportData.active_companies.epp = extract(joins, 'EPP');
            // ME is tricky because it's inside MEI/NOME, assume "ME " with space
        }
    }

    return reportData;
}


// ----------------------------------------------------------------------
// WORD/TEXT PARSER (Regex + Sanitization)
// ----------------------------------------------------------------------
async function parseWordReport(buffer) {
    const { value: text } = await mammoth.extractRawText({ buffer: buffer });
    return parseTextContent(text);
}

function parseTextContent(text) {
    const reportData = initReportData();

    // Data
    const monthMap = { 'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4, 'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8, 'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12 };
    const dateMatch = text.match(/RELATÓRIO PRODUTIVIDADE\s*-\s*([A-ZÇ]+)/i);
    if (dateMatch) {
        const monthStr = dateMatch[1].toUpperCase().trim();
        if (monthMap[monthStr]) reportData.month = monthMap[monthStr];
    }

    // Produtividade (Table anchors in text)
    // Start: PRODUTIVIDADE ... End: TOTAL
    const prodBlockMatch = text.match(/PRODUTIVIDADE ANALISE([\s\S]+?)TOTAL/i);
    if (prodBlockMatch) {
        const prodRegex = /([A-Z\s]+)\s+(\d+)\s+(\d+)\s+(\d+)/g;
        let match;
        while ((match = prodRegex.exec(prodBlockMatch[1])) !== null) {
            if (match[1].length > 2) {
                reportData.analyst_stats.push({
                    name: normalizeName(match[1]),
                    exigencia: parseInt(match[2]),
                    deferidos: parseInt(match[3]),
                    total: parseInt(match[4])
                });
            }
        }
    }

    // Empresas with Dot Sanitization
    // "MEI 141.243" -> 141243
    const companiesBlockMatch = text.match(/EMPRESAS ATIVAS POR PORTE([\s\S]+)/i);
    if (companiesBlockMatch) {
        const block = companiesBlockMatch[1];
        const extractNumber = (label) => {
            const regex = new RegExp(`${label}\\s+([\\d\\.]+)`, 'i');
            const match = block.match(regex);
            if (match) return parseInt(match[1].replace(/\./g, '')); // Remove thousands separator
            return 0;
        };
        reportData.active_companies.mei = extractNumber('MEI');
        reportData.active_companies.me = extractNumber('ME');
        reportData.active_companies.epp = extractNumber('EPP');
        reportData.active_companies.demais = extractNumber('Demais');
    }

    // Fluxo simples
    const autoMatch = text.match(/DEFERIMENTO AUTOMÁTICO\s+(\d+)/i);
    if (autoMatch) reportData.process_stats.automatico = parseInt(autoMatch[1]);

    return reportData;
}


function initReportData() {
    return {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        active_companies: { mei: 0, me: 0, epp: 0, demais: 0 },
        process_stats: { automatico: 0, exigencia: 0, deferidos: 0 },
        detailed_process_stats: { automatico: { inscricao: 0, alteracao: 0, baixa: 0 }, services_by_size: {} },
        analyst_stats: [],
        requirements_stats: [],
        sla_stats: [],
        general_sla_stats: [],
        certificate_stats: { simplificada: 0, inteiro_teor: 0, especifica: 0 },
        book_stats: { digital: { analyzed: 0, requirements: 0 }, paper: { analyzed: 0, requirements: 0 } },
        support_stats: [],
        cadastral_stats: [],
        peak_hours: []
    };
}

function normalizeName(name) {
    return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

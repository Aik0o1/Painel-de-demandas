from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, RegistryEntry, RegistryReport
from core.security import get_current_user, check_permission

router = APIRouter()

class RegistryItemCreate(BaseModel):
    protocol_number: str
    document_type: str
    party_name: str
    deadline_date: Optional[datetime] = None
    status: str = "PENDING"
    notes: Optional[str] = None

class RegistryItemUpdate(BaseModel):
    protocol_number: Optional[str] = None
    document_type: Optional[str] = None
    party_name: Optional[str] = None
    deadline_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ReportPayload(BaseModel):
    month: int
    year: int
    data: Any

def format_registry_entry(item: RegistryEntry):
    return {
        "id": item.id,
        "protocol_number": item.protocolNumber,
        "document_type": item.documentType,
        "party_name": item.partyName,
        "deadline_date": item.deadlineDate.isoformat() if item.deadlineDate else None,
        "status": item.status,
        "notes": item.notes,
        "createdAt": item.createdAt.isoformat() if item.createdAt else None,
        "updatedAt": item.updatedAt.isoformat() if item.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_registry_items(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(RegistryEntry).order_by(RegistryEntry.createdAt.desc()))
    items = result.scalars().all()
    return [format_registry_entry(i) for i in items]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_registry_item(item: RegistryItemCreate, user: User = Depends(check_permission("registro", "create")), db_session: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    new_item = RegistryEntry(
        id=str(uuid.uuid4()),
        protocolNumber=item.protocol_number,
        documentType=item.document_type,
        partyName=item.party_name,
        deadlineDate=item.deadline_date,
        status=item.status,
        notes=item.notes,
        createdAt=now,
        updatedAt=now,
    )
    db_session.add(new_item)
    await db_session.commit()
    await db_session.refresh(new_item)
    return format_registry_entry(new_item)

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_registry_item(id: str, update_data: RegistryItemUpdate, user: User = Depends(check_permission("registro", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(RegistryEntry).where(RegistryEntry.id == id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    data = update_data.dict(exclude_unset=True)
    if "protocol_number" in data: item.protocolNumber = data["protocol_number"]
    if "document_type" in data: item.documentType = data["document_type"]
    if "party_name" in data: item.partyName = data["party_name"]
    if "deadline_date" in data: item.deadlineDate = data["deadline_date"]
    if "status" in data: item.status = data["status"]
    if "notes" in data: item.notes = data["notes"]
    
    item.updatedAt = datetime.utcnow()
    await db_session.commit()
    await db_session.refresh(item)
    return format_registry_entry(item)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_registry_item(id: str, user: User = Depends(check_permission("registro", "delete")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(delete(RegistryEntry).where(RegistryEntry.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    await db_session.commit()
    return {"message": "Item deleted successfully"}

# --- Registry Stats ---

@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_stats(type: Optional[str] = Query(None), month: Optional[int] = None, year: Optional[int] = None, date: Optional[str] = None, user: User = Depends(get_current_user)):
    from core.couchdb_client import get_registro_db
    try:
        db = get_registro_db()
        
        target_id = None
        if month and year:
            target_id = f"{month:02d}-{year}"
        else:
            ids = [doc_id for doc_id in db if '-' in doc_id]
            if ids:
                def sort_key(doc_id):
                    m, y = doc_id.split('-')
                    return (int(y), int(m))
                ids.sort(key=sort_key, reverse=True)
                target_id = ids[0]
                
        if not target_id or target_id not in db:
            return {"success": False, "data": {}, "message": "Nenhum dado encontrado para o período"}

        d = db[target_id]
        
        # Mapeamento dos dados para o Frontend (Simplified version for brevity, keeping original logic)
        analyst_stats = []
        detalhe = d.get('novembro_analise', {}).get('detalhe_por_usuario', [])
        for u in detalhe:
            if u.get('usuario') != 'TOTAL':
                analyst_stats.append({
                    'name': u.get('usuario'),
                    'exigencia': u.get('exigencia', 0),
                    'deferidos': u.get('deferidos', 0),
                    'total': u.get('quantidade', 0)
                })

        req_stats = []
        esclarecer = d.get('tempo_analistas', {}).get('esclarecer_exigencia', [])
        for u in esclarecer:
            if u.get('usuario') != 'TOTAL':
                req_stats.append({
                    'analyst_name': u.get('usuario'),
                    'pending_clarification': u.get('qtd_esclarecer_exigencia', 0),
                    'answered': u.get('qtd_exigencia_respondidas', 0)
                })

        cert_stats = {}
        certidoes = d.get('analise_geral', {}).get('certidoes', [])
        cert_map = {
            "Simplificada": "simplificada",
            "Inteiro teor": "inteiro_teor",
            "Específica": "especifica",
            "Específica - Histórico de Ato Arquivado": "especifica_historico",
            "Específica - Participação Societária de Pessoa Jurídica em Sociedade": "especifica_societaria_pj",
            "Específica - Linha do tempo": "especifica_linha_tempo",
            "Específica - Livros": "especifica_livros",
            "Específica - Matrícula de Leiloeiro": "especifica_leiloeiro",
            "Específica - A Definir Relato": "especifica_relato",
            "Específica - Ônus": "especifica_onus"
        }
        for c in certidoes:
            name = c.get('certidao')
            if name in cert_map:
                cert_stats[cert_map[name]] = c.get('quantidade', 0)

        book_stats = {
            'digital': {'analyzed': 0, 'requirements': 0},
            'paper': {'analyzed': 0, 'requirements': 0}
        }
        analise_livros = d.get('analise_geral', {}).get('analise_livros', {})
        if 'DEFERIMENTO_AUTOMATICO' in analise_livros:
            auto = analise_livros['DEFERIMENTO_AUTOMATICO']
            book_stats['digital'] = {'analyzed': auto.get('analisados', 0), 'requirements': auto.get('exigencia', 0)}
        if 'GELZUITA' in analise_livros:
            gelz = analise_livros['GELZUITA']
            book_stats['paper'] = {'analyzed': gelz.get('analisados', 0), 'requirements': gelz.get('exigencia', 0)}

        cadastral_stats = []
        atualizacoes = d.get('analise_geral', {}).get('atualizacoes_por_usuario', [])
        for u in atualizacoes:
            cadastral_stats.append({
                'analyst_name': u.get('usuario'),
                'updated': u.get('atualizadas', 0),
                'rejected': u.get('rejeitadas', 0)
            })

        process_stats = {'automatico': 0, 'exigencia': 0, 'deferidos': 0}
        proc_totais = d.get('novembro_analise', {}).get('processos_totais_incluindo_deferimento_automatico', [])
        for p in proc_totais:
            ptype = p.get('processo')
            qty = p.get('quantidade', 0)
            if 'AUTOMATICO' in ptype:
                process_stats['automatico'] = qty
            elif 'EXIGÊNCIA' in ptype:
                process_stats['exigencia'] = qty
            elif 'DEFERIDOS' in ptype:
                process_stats['deferidos'] = qty

        detailed_process_stats = {
            'automatico': {'inscricao': 0, 'alteracao': 0, 'baixa': 0},
            'services_by_size': {}
        }
        def_auto = d.get('analise_geral', {}).get('deferimento_automatico_por_porte', {})
        if 'TOTAL' in def_auto:
            tot = def_auto['TOTAL']
            detailed_process_stats['automatico'] = {
                'inscricao': tot.get('inscricao_empresa', 0),
                'alteracao': tot.get('alteracao', 0),
                'baixa': tot.get('pedido_baixa', 0)
            }
        for k, v in def_auto.items():
            if k != 'TOTAL':
                detailed_process_stats['services_by_size'][k.lower()] = {
                    'inscricao': v.get('inscricao_empresa', 0),
                    'alteracao': v.get('alteracao', 0),
                    'baixa': v.get('pedido_baixa', 0)
                }

        analyst_time_stats = []
        tempo_por_analista = d.get('tempo_analistas', {}).get('tempo_por_analista', [])
        for u in tempo_por_analista:
            if u.get('usuario') != 'TOTAL':
                analyst_time_stats.append({
                    'name': u.get('usuario'),
                    'avg_judgement_time': u.get('tempo_medio_julgamento_singular'),
                    'avg_authentication_time': u.get('tempo_medio_autenticacao'),
                    'avg_archiving_time': u.get('tempo_medio_arquivamento')
                })

        empresas_ativas = d.get('empresas_ativas', {"MEI": 0, "ME": 0, "EPP": 0, "DEMAIS": 0, "TOTAL": 0})

        return {
            "success": True, 
            "data": {
                "active_companies": empresas_ativas,
                "analyst_stats": analyst_stats,
                "requirements_stats": req_stats,
                "analyst_time_stats": analyst_time_stats,
                "certificate_stats": cert_stats,
                "book_stats": book_stats,
                "cadastral_stats": cadastral_stats,
                "process_stats": process_stats,
                "detailed_process_stats": detailed_process_stats,
                "period": target_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar CouchDB: {str(e)}")

@router.get("/report/pdf")
async def get_pdf_report(month: Optional[int] = None, year: Optional[int] = None, user: User = Depends(get_current_user)):
    from core.couchdb_client import get_registro_db
    import io
    from fastapi.responses import StreamingResponse
    from services.pdf_generator import gerar_relatorio_from_data
    
    try:
        db = get_registro_db()
        target_id = f"{month:02d}-{year}" if month and year else None
        
        if not target_id:
            ids = [doc_id for doc_id in db if '-' in doc_id]
            if ids:
                def sort_key(doc_id):
                    m, y = doc_id.split('-')
                    return (int(y), int(m))
                ids.sort(key=sort_key, reverse=True)
                target_id = ids[0]
                
        if not target_id or target_id not in db:
            raise HTTPException(status_code=404, detail="Dados não encontrados")

        doc_data = dict(db[target_id])
        pdf_bytes = gerar_relatorio_from_data(doc_data)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes), 
            media_type="application/pdf", 
            headers={"Content-Disposition": f'attachment; filename="relatorio_registro_{target_id}.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual-entry", status_code=status.HTTP_201_CREATED)
async def save_manual_entry(payload: ReportPayload, db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(
        select(RegistryReport).where(RegistryReport.month == payload.month, RegistryReport.year == payload.year)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        report = RegistryReport(
            id=str(uuid.uuid4()),
            month=payload.month,
            year=payload.year,
            data=payload.data
        )
        db_session.add(report)
    else:
        report.data = payload.data
        
    await db_session.commit()
    await db_session.refresh(report)
    return {"success": True, "message": "Relatório salvo manualmente", "data": {"id": report.id}}

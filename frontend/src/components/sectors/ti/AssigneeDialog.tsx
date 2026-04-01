"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiGet } from "@/services/api";
import { Loader2, UserPlus } from "lucide-react";

interface AssigneeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: any;
    onAssign: (userIds: string[], usersData?: {id: string, name: string}[]) => Promise<void>;
}

export default function AssigneeDialog({ isOpen, onClose, ticket, onAssign }: AssigneeDialogProps) {
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTechnicians();
            if (ticket?.assigned_to && Array.isArray(ticket.assigned_to)) {
                setSelectedIds(ticket.assigned_to.map((u: any) => u.id));
            } else if (ticket?.assigned_to_id) {
                // Backward compatibility
                setSelectedIds([ticket.assigned_to_id]);
            } else {
                setSelectedIds([]);
            }
        }
    }, [isOpen, ticket]);

    const fetchTechnicians = async () => {
        setIsLoadingUsers(true);
        try {
            const users = await apiGet("/tickets/ti-users");
            setTechnicians(users);
        } catch (error) {
            console.error("Erro ao buscar técnicos:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const selectedUsersData = technicians.filter(tech => selectedIds.includes(tech.id)).map(tech => ({ id: tech.id, name: tech.name }));
            await onAssign(selectedIds, selectedUsersData);
            onClose();
        } catch (error) {
            console.error("Erro ao salvar atribuição:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Atribuir Responsáveis
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <Label>Selecione os Técnicos da TI</Label>
                        {isLoadingUsers ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Carregando técnicos...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                                {technicians.map((tech) => (
                                    <div key={tech.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                                        <Checkbox 
                                            id={`tech-${tech.id}`} 
                                            checked={selectedIds.includes(tech.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedIds([...selectedIds, tech.id]);
                                                } else {
                                                    setSelectedIds(selectedIds.filter(id => id !== tech.id));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`tech-${tech.id}`} className="flex-1 cursor-pointer font-medium">
                                            {tech.name}
                                        </Label>
                                    </div>
                                ))}       
                                {technicians.length === 0 && !isLoadingUsers && (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        Nenhum técnico encontrado.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || isLoadingUsers}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Confirmar Atribuição"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

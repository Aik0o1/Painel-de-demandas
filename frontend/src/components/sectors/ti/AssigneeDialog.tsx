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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/services/api";
import { Loader2, UserPlus } from "lucide-react";

interface AssigneeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: any;
    onAssign: (assignedToId: string) => Promise<void>;
}

export default function AssigneeDialog({ isOpen, onClose, ticket, onAssign }: AssigneeDialogProps) {
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTechnicians();
            setSelectedId(ticket?.assigned_to_id || "unassigned");
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
            await onAssign(selectedId === "unassigned" ? "" : selectedId);
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
                        Atribuir Responsável
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="technician">Selecione o Técnico da TI</Label>
                        {isLoadingUsers ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Carregando técnicos...
                            </div>
                        ) : (
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger id="technician" className="w-full">
                                    <SelectValue placeholder="Selecione um técnico" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Sem responsável</SelectItem>
                                    {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                            {tech.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

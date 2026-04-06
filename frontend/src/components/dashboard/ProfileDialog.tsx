import { useState, useEffect, useRef } from "react";
import { User, Mail, Settings, LogOut, X, ChevronRight, Lock, CreditCard, Briefcase, Loader2, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { profile, isLoading, updateProfile, changePassword, uploadAvatar } = useCurrentProfile();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable states
  const [userPositionState, setUserPositionState] = useState("");
  const [userFunctionState, setUserFunctionState] = useState("");
  const [isPasswordView, setIsPasswordView] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);

  // Update states when profile loads
  useEffect(() => {
    if (profile) {
      setUserPositionState(profile.position || "");
      setUserFunctionState(profile.function || "");
    }
  }, [profile]);

  const fullName = profile?.full_name || user?.name || "Usuário";
  const userEmail = profile?.email || user?.email || "";
  const userCpf = profile?.cpf || "Não informado";
  const displayPosition = userPositionState || profile?.position || "Sem cargo";

  const handleSignOut = async () => {
    await apiPost('auth/logout', {});
    await signOut();
    onOpenChange(false);
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({
      position: userPositionState,
      function: userFunctionState
    }, {
      onSuccess: () => {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });
      }
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    uploadAvatar.mutate(formData, {
      onSuccess: () => {
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi alterada com sucesso.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Erro ao carregar foto",
          description: err.message || "Não foi possível carregar a imagem.",
          variant: "destructive"
        });
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPasswordError(null);
    setMatchError(null);

    if (newPassword !== confirmPassword) {
      setMatchError("As senhas não coincidem.");
      toast({
        title: "Erro na senha",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      setMatchError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    changePassword.mutate({
      currentPassword,
      newPassword
    }, {
      onSuccess: () => {
        setIsPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Reset success view after 3 seconds or when user clicks back
        setTimeout(() => {
          setIsPasswordSuccess(false);
          setIsPasswordView(false);
        }, 4000);
      },
      onError: (err: any) => {
        // Com a mudança no api.ts, a mensagem já vem em err.message
        const errorMessage = err.message || "Ocorreu um erro inesperado.";

        if (errorMessage.toLowerCase().includes("senha atual")) {
          setCurrentPasswordError(errorMessage);
        } else {
          setMatchError(errorMessage);
        }
      }
    });
  };

  if (isLoading && !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-transparent border-none shadow-none flex items-center justify-center p-0 text-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-md w-full overflow-hidden sm:max-w-md [&>button]:hidden">
        <div className="relative flex flex-col w-full bg-background font-display text-foreground selection:bg-primary selection:text-white antialiased overflow-hidden rounded-2xl shadow-xl border border-border">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-circuit-pattern pointer-events-none z-0 opacity-20 dark:opacity-30"></div>

          {/* Header */}
          <div className="relative z-20 flex items-center justify-between p-4 pb-2 border-b border-border bg-muted/30">
            <div className="size-10 shrink-0" />
            <h2 className="text-foreground text-lg font-bold leading-tight tracking-wider flex-1 text-center uppercase">
              {isPasswordView ? "Segurança" : "Perfil"}
            </h2>
            <button
              onClick={() => isPasswordView ? setIsPasswordView(false) : onOpenChange(false)}
              className="hover:text-primary transition-colors flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted outline-none"
            >
              <X className="w-5 h-5 text-foreground/70" />
            </button>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto max-h-[85vh] scroller-none">
            {!isPasswordView ? (
              <>
                {/* Profile Hero Section */}
                <section className="flex flex-col items-center pt-6 pb-8 px-4 relative">
                  <div className="relative group">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-transparent opacity-75 blur-md group-hover:opacity-100 transition duration-500"></div>
                    <div
                      onClick={handlePhotoClick}
                      className="relative rounded-full p-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent shadow-md cursor-pointer group/photo"
                    >
                      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 border-4 border-background bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {uploadAvatar.isPending ? (
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (profile?.image || user?.image) ? (
                          <img
                            src={profile?.image || user?.image || undefined}
                            alt="Profile"
                            className="w-full h-full object-cover group-hover/photo:opacity-40 transition-opacity"
                          />
                        ) : (
                          <User className="w-12 h-12 text-white/50" />
                        )}

                        {!uploadAvatar.isPending && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-background">
                      <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_#10b981] animate-pulse"></div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center mt-5 space-y-1">
                    <h1 className="text-foreground text-2xl font-bold tracking-tight text-center">{fullName}</h1>
                    <p className="text-primary text-sm font-medium tracking-wide uppercase">{displayPosition}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-primary/10 border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span className="text-xs text-primary font-semibold tracking-widest uppercase">Online</span>
                    </div>
                  </div>
                </section>

                {/* Personal Info Card */}
                <main className="flex-1 px-4 pb-8 space-y-6">
                  <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-2 border-b border-border/50">
                      <h3 className="text-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2 opacity-70">
                        <Briefcase className="text-primary w-4 h-4" />
                        Informações Pessoais
                      </h3>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <Mail className="text-muted-foreground w-5 h-5" />
                      </div>
                      <div className="flex flex-col justify-center border-b border-border/50 pb-2">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Email</span>
                        <span className="text-foreground text-sm font-medium truncate" title={userEmail}>{userEmail}</span>
                      </div>

                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <CreditCard className="text-muted-foreground w-5 h-5" />
                      </div>
                      <div className="flex flex-col justify-center border-b border-border/50 pb-2">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">CPF</span>
                        <span className="text-foreground text-sm font-medium">{userCpf}</span>
                      </div>

                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <Briefcase className="text-muted-foreground w-5 h-5" />
                      </div>
                      <div className="flex flex-col justify-center border-b border-border/50 pb-2">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Cargo</span>
                        <select
                          value={userPositionState}
                          onChange={(e) => setUserPositionState(e.target.value)}
                          className="bg-transparent border-none text-foreground text-sm font-medium p-0 focus:ring-0 w-full"
                        >
                          <option value="" disabled>Selecione</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Analista">Analista</option>
                          <option value="Coordenador">Coordenador</option>
                          <option value="Diretor">Diretor</option>
                          <option value="Estagiário">Estagiário</option>
                          <option value="Técnico">Técnico</option>
                          <option value="Assistente">Assistente</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <Settings className="text-muted-foreground w-5 h-5" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Função / Depto</span>
                        <select
                          value={userFunctionState}
                          onChange={(e) => setUserFunctionState(e.target.value)}
                          className="bg-transparent border-none text-foreground text-sm font-medium p-0 focus:ring-0 w-full"
                        >
                          <option value="" disabled>Selecione</option>
                          <option value="Administrativo">Administrativo</option>
                          <option value="Financeiro">Financeiro</option>
                          <option value="Tecnologia">Tecnologia</option>
                          <option value="Jurídico">Jurídico</option>
                          <option value="Recursos Humanos">Recursos Humanos</option>
                          <option value="Comunicação">Comunicação</option>
                          <option value="Registro">Registro</option>
                          <option value="Operacional">Operacional</option>
                        </select>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-muted/50 flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isPending}
                        className="text-primary text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                      </button>
                    </div>
                  </section>

                  {/* Security Button */}
                  <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setIsPasswordView(true)}
                      className="flex items-center justify-between p-4 hover:bg-muted transition-colors group w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider text-foreground">Segurança & Senha</span>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:text-foreground w-5 h-5" />
                    </button>
                  </section>

                  {/* Logout Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full relative group overflow-hidden rounded-xl border border-destructive/20 p-4 transition-all duration-300 hover:border-destructive hover:bg-destructive/5"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <LogOut className="text-destructive w-5 h-5" />
                      <span className="text-destructive font-bold uppercase tracking-widest text-sm">Sair do Sistema</span>
                    </div>
                  </button>


                </main>
              </>
            ) : isPasswordSuccess ? (
              /* Success View */
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                  <div className="relative h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-foreground font-bold text-xl tracking-tight">Senha Atualizada!</h3>
                  <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">
                    Sua nova senha de acesso foi configurada com sucesso e já está pronta para uso.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsPasswordSuccess(false);
                    setIsPasswordView(false);
                  }}
                  className="px-8 py-2.5 bg-muted hover:bg-muted/80 rounded-full text-xs font-bold uppercase tracking-widest text-foreground transition-all border border-border"
                >
                  Voltar ao Perfil
                </button>
              </div>
            ) : (
              /* Change Password View */
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-foreground font-bold text-lg">Alterar Senha</h3>
                  <p className="text-muted-foreground text-sm">Atualize sua senha de acesso periodicamente para sua segurança.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha Atual</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (currentPasswordError) setCurrentPasswordError(null);
                        }}
                        className={`w-full bg-muted border-none rounded-lg px-4 py-3 text-sm focus:ring-2 outline-none pr-10 ${currentPasswordError ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
                        required
                      />
                      <KeyRound className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${currentPasswordError ? 'text-destructive' : 'opacity-50'}`} />
                    </div>
                    {currentPasswordError && (
                      <p className="text-[10px] font-bold text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
                        {currentPasswordError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (matchError) setMatchError(null);
                        }}
                        className={`w-full bg-muted border-none rounded-lg px-4 py-3 text-sm focus:ring-2 outline-none pr-10 ${matchError ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
                        required
                      />
                      <Lock className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${matchError ? 'text-destructive' : 'opacity-50'}`} />
                    </div>
                  </div>

                  <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (matchError) setMatchError(null);
                        }}
                        className={`w-full bg-muted border-none rounded-lg px-4 py-3 text-sm focus:ring-2 outline-none pr-10 ${matchError ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
                        required
                      />
                      <CheckCircle2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${confirmPassword && confirmPassword === newPassword ? 'text-primary' : (matchError ? 'text-destructive' : 'opacity-20')}`} />
                    </div>
                    {matchError && (
                      <p className="text-[10px] font-bold text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
                        {matchError}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPasswords ? "Ocultar senhas" : "Ver senhas"}
                  </button>

                  <div className="pt-4 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={changePassword.isPending}
                      className="w-full bg-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      {changePassword.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      Atualizar Senha
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPasswordView(false)}
                      className="w-full bg-transparent hover:bg-muted font-bold py-3 rounded-lg text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>

                <div className="p-4 bg-muted/50 rounded-xl border border-primary/10 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Certifique-se de escolher uma senha forte com pelo menos 8 caracteres, mesclando letras, números e caracteres especiais.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

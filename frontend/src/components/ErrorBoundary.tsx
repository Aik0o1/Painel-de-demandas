import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-red-50 text-red-900">
                    <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl border border-red-200">
                        <h1 className="text-2xl font-bold mb-4 text-red-600">Algo deu errado</h1>
                        <p className="mb-4 text-gray-700">Ocorreu um erro inesperado na aplicação:</p>
                        <pre className="p-4 bg-gray-100 rounded text-sm font-mono overflow-auto max-h-96 text-red-800">
                            {this.state.error?.toString()}
                        </pre>
                        <p className="mt-4 text-sm text-gray-500">
                            Verifique o console do navegador para mais detalhes.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

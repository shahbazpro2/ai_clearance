interface AuthHeaderProps {
    title: string;
    showLogo?: boolean;
}

export function AuthHeader({ title, showLogo = true }: AuthHeaderProps) {
    return (
        <div className=" mb-5">
            {showLogo && (
                <div className="flex items-center justify-center mb-2 text-2xl font-bold text-gray-900">
                    Insert Media
                </div>
            )}
            <h1 className="text-lg font-bold text-gray-900 mb-2 text-center">{title}</h1>
        </div>
    );
}

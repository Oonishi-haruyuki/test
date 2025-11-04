import { AppHeader } from "@/components/header";
import { ReactNode } from "react";

export default function MainLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <>
            <AppHeader />
            <main>{children}</main>
        </>
    )
}

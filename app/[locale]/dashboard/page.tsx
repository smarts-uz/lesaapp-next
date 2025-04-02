"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Header from "@/components/dashboard/header";

export default function Dashboard() {
  const params = useParams();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">{t("dashboard", "Dashboard")}</h1>
        <p>{t("welcomeToDashboard", "Welcome to the Dashboard. This is where you'll manage your system.")}</p>
      </main>
    </div>
  );
} 
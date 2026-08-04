const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-GB", ar: "ar-MA" };

export const getDate = (
  dateString: string,
  output: "date" | "time",
  lang: string = "fr"
): string => {
  const dateObj = new Date(dateString);

  if (isNaN(dateObj.getTime())) {
    throw new Error("Date invalide");
  }

  const locale = localeMap[lang] ?? "fr-FR";

  if (output === "date") {

    return dateObj.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } else {

    return dateObj.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

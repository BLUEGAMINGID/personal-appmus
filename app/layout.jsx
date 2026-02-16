import "./globals.css";
import Navbar from "@/components/Navbar";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import "./nprogress.css";
import { Analytics } from "@vercel/analytics/react";
import ClientTopProgressBar from "@/components/ClientTopProgressBar";

export const metadata = {
    title: "Danish Fiqhi Arrazy | Portofolio",

    description:
		"My name is Danish, I'm a Student & Server Manager and I'm passionate about it. I'm currently studying at MAN 5 Jakarta.",

    author: "Danish Fiqhi Arrazy",
    siteUrl: "https://www.danz-kev.biz.id",
    applicationName: "Danish",

    keywords: [
		"Danish",
		"DanZKev",
		"Danish shafel",
		"Dan",
		"Danish Fiqhi",
		"Danish Fiqhi Arrazy",
		"DanZKev",
		"Danish porto",
		"Danish um",
	],

    openGraph: {
		type: "website",
		url: "https://www.danz-kev.biz.id",
		title: "Danish Fiqhi Arrazy | Portofolio",
		site_name: "Danish Fiqhi Arrazy | Portofolio",
		description: "My name is Danish, I'm a Student & Server Manager and I'm passionate about it. I'm currently studying at MAN 5 Jakarta..",
		width: 1200,
		height: 630,
		images: [
			{
				url: "/og-image-rev.png",
				alt: "Alvalens Portofolio",
			},
		],
		site_name: "Danish Fiqhi Arrazy | Portofolio",
	}
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<ClientTopProgressBar />
				{/* <Navbar /> */}
				{children}
				<Analytics />
			</body>
		</html>
	);
}

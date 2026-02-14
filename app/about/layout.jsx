import Footer from "@/components/Footer";

export const metadata = {
  title: "Danish | About"
};
export default function Layout({ children }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}

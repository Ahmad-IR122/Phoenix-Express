import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import ScrollTopButton from "./Components/common/ScrollTopButton";

function App() {
  return (
    <>
      <AppRoutes />
      <ScrollTopButton />
    </>
  );
}

export default App;

import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Login } from "../common/Login"
import { Signup } from "../common/Singup"
import { HeroPage } from "../pages/HeroPage"

const router = createBrowserRouter([
    {
        path:"/",
        element:<HeroPage/>
    },
    {
        path:"/login",
        element:<Login></Login>
    },
    {
        path:"/signup",
        element:<Signup/>
    },

])
const AppRouter = ()=>{

    return <RouterProvider router={router}></RouterProvider>
}
export default AppRouter
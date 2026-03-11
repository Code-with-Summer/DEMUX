import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.component.jsx";
import UserAuthForm from "./pages/userAuthForm.page.jsx";
import HomePage from "./pages/home.page.jsx";
import CreateBlogPage from "./pages/createBlog.page.jsx";
import BlogPage from "./pages/blog.page.jsx";
import DashboardPage from "./pages/dashboard.page.jsx";
import EditBlogPage from "./pages/editBlog.page.jsx";
import ProfilePage from "./pages/profile.page.jsx";
import SavedPage from "./pages/saved.page.jsx";
import AnalyticsPage from "./pages/analytics.page.jsx";
import { UserContextProvider } from "./common/user-context.jsx";
import { SiteTitleProvider } from "./common/site-title-context.jsx";

const App = () => {
    return (
        <UserContextProvider>
            <SiteTitleProvider>
                <Routes>
                    <Route path="/" element={<Navbar />}>
                        <Route index element={<HomePage />} />
                        <Route path="signin" element={<UserAuthForm type="sign-in" />} />
                        <Route path="signup" element={<UserAuthForm type="sign-up" />} />
                         <Route path="create-blog" element={<CreateBlogPage />} />
                        <Route path="blog/:blogId" element={<BlogPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="saved" element={<SavedPage />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="edit-blog/:blogId" element={<EditBlogPage />} />
                    </Route>
                </Routes>
            </SiteTitleProvider>
        </UserContextProvider>
    )
}

export default App;

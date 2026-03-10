import { createContext, useContext, useState, useEffect } from 'react';

const SiteTitleContext = createContext();

export const useSiteTitle = () => useContext(SiteTitleContext);

export const SiteTitleProvider = ({ children }) => {
    const [siteTitle, setSiteTitle] = useState(() => localStorage.getItem('siteTitle') || 'Simple Blog');

    const fetchSiteTitle = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/settings/site');
            if (response.ok) {
                const data = await response.json();
                if (data.blogTitle && data.blogTitle !== siteTitle) {
                    setSiteTitle(data.blogTitle);
                    localStorage.setItem('siteTitle', data.blogTitle);
                    document.title = data.blogTitle;
                }
            }
        } catch (err) {
            console.log('Using local site title');
        }
    };

    useEffect(() => {
        fetchSiteTitle();
    }, []);

    useEffect(() => {
        document.title = siteTitle;
    }, [siteTitle]);

    useEffect(() => {
        const handler = (e) => {
            const newTitle = e?.detail?.blogTitle || localStorage.getItem('siteTitle') || 'Simple Blog';
            setSiteTitle(newTitle);
            document.title = newTitle;
        };
        window.addEventListener('siteTitleChanged', handler);
        
        const storageHandler = (e) => {
            if (e.key === 'siteTitle') {
                const newTitle = e.newValue || 'Simple Blog';
                setSiteTitle(newTitle);
                document.title = newTitle;
            }
        };
        window.addEventListener('storage', storageHandler);
        
        const intervalId = setInterval(fetchSiteTitle, 60000);

        const focusHandler = () => {
            fetchSiteTitle();
        };
        window.addEventListener('focus', focusHandler);

        return () => {
            window.removeEventListener('siteTitleChanged', handler);
            window.removeEventListener('storage', storageHandler);
            window.removeEventListener('focus', focusHandler);
            clearInterval(intervalId);
        };
    }, []);

    const updateSiteTitle = (newTitle) => {
        setSiteTitle(newTitle);
        localStorage.setItem('siteTitle', newTitle);
        document.title = newTitle;
        window.dispatchEvent(new CustomEvent('siteTitleChanged', { detail: { blogTitle: newTitle } }));
    };

    return (
        <SiteTitleContext.Provider value={{ siteTitle, updateSiteTitle }}>
            {children}
        </SiteTitleContext.Provider>
    );
};


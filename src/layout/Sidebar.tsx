import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { BsInboxesFill } from "react-icons/bs";
import { GiClothes } from "react-icons/gi";
import { FaArrowDownWideShort } from "react-icons/fa6";
import logo from "@/assets/FIRDAOUS STORE.png";
import { FaHome, FaSignOutAlt, FaTag } from "react-icons/fa";
import { MdLanguage, MdOutlineSettings, MdOutlineEmail } from "react-icons/md";
import { useLangContext } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { ImStatsDots } from "react-icons/im";
import { selectedLang } from "@/utils/i18n";
import { useAuth } from "@/contexts/Authentication";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar : React.FC = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    // FIX: was `window.location.pathname` read once at mount — harmless
    // under the old goTo()-hard-reload navigation (every page was a fresh
    // mount), but now that navigation is client-side, the Sidebar instance
    // stays mounted across routes and this would go stale, freezing the
    // "active" highlight on whichever page first mounted it.
    const location = useLocation();
    const {signOut, user} = useAuth();
    const {currentLang, setCurrentLang} = useLangContext();
    const actual = location.pathname.slice(1);
    const [isPhone, setIsPhone] = useState<boolean>();

    useEffect(()=>{
        const handleResize = () =>{
            if(window.innerWidth <= 855){ setIsPhone(true); }
            else { setIsPhone(false); }
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return ()=>window.removeEventListener("resize", handleResize)
    },[])

    const SignOut = () => {
        signOut();
        navigate('/Login');
    }

    if(isPhone){ return <></> }

    return(<>
        <div className={`${selectedLang(currentLang) == 'ar' ? 'db-sidebar-rtl rtl' : 'db-sidebar'} shadow justify-content-between`}>
            <div className={`${selectedLang(currentLang) == 'ar' ? 'db-sidebar-header-rtl rtl' : 'db-sidebar-header'} shadow-sm`}>
                <div className="db-sidebar-logo my-2" onClick={() => navigate('/Home')}><img src={logo} alt=""/></div>
                <h5 className="text-center fw-bold my-2">STORE DASHBOARD</h5>
            </div>
            <ul className={`db-sidebar-list ${selectedLang(currentLang) == 'ar' ? 'rtl' : ''}`}>
                <li className="d-flex rounded" style={{zIndex:11000}}>
                    <MdLanguage size={20}/>
                    <select className="mx-1 sidebar-lang fw-bold" onChange={(e) => setCurrentLang(e.target.value)} value={currentLang}>
                        <option>Français</option>
                        <option>العربية</option>
                        <option>English</option>
                    </select>
                </li>
                <li className={`my-3 rounded ${actual.toLowerCase() == 'home' && 'DbIsClicked'}`} onClick={() => navigate("/Home")}><FaHome className="me-2"/> {t('nav.home')}</li>
                <li className={`my-3 rounded ${actual.toLowerCase() == 'orders' && 'DbIsClicked'}`} onClick={() => navigate("/Orders")}><BsInboxesFill className="me-2"/> {t('nav.orders')}</li>
                <li className={`my-3 rounded ${actual.toLowerCase() == 'deficiency' && 'DbIsClicked'}`} onClick={() => navigate("/Deficiency")}><FaArrowDownWideShort className="me-2"/> {t('admin.deficiency.title')}</li>
                <li className={`my-3 rounded ${actual.toLowerCase() == 'productmanager' && 'DbIsClicked'}`} onClick={() => navigate('/ProductManager')}><GiClothes className="me-2"/> {t('admin.product.management')}</li>
                {user?.role !== 'delivery' && <li className={`my-3 rounded ${actual.toLowerCase() == 'promotions' && 'DbIsClicked'}`} onClick={() => navigate('/Promotions')}><FaTag className="me-2"/> {t('nav.promotions')}</li>}
                <div className={`my-2 rounded db-sidebar-action db-statistics-btn ${actual.toLowerCase() == 'statistics' && 'DbIsClicked'}`} onClick={() => navigate("/Statistics")}>
                    <span className="db-sidebar-action-icon db-sidebar-action-icon--stats"><ImStatsDots/></span>
                    <span>{t('nav.statistics')}</span>
                </div>
                {user?.role === 'admin' && (
                <div className={`my-2 rounded db-sidebar-action db-newsletter-btn ${actual.toLowerCase() == 'newsletter' && 'DbIsClicked'}`} onClick={() => navigate("/Newsletter")}>
                    <span className="db-sidebar-action-icon db-sidebar-action-icon--newsletter"><MdOutlineEmail/></span>
                    <span>{t('nav.newsletter') || 'Newsletter'}</span>
                </div>
                )}
                <div className={`my-2 rounded db-sidebar-action db-settings-btn ${actual.toLowerCase() == 'settings' && 'DbIsClicked'}`} onClick={() => navigate("/Settings")}>
                    <span className="db-sidebar-action-icon db-sidebar-action-icon--settings"><MdOutlineSettings/></span>
                    <span>{t('nav.settings')}</span>
                </div>
                <div className="my-2 rounded db-sidebar-action db-signout" onClick={SignOut}>
                    <span className="db-sidebar-action-icon db-sidebar-action-icon--signout"><FaSignOutAlt/></span>
                    <span>{t('nav.signOut')}</span>
                </div>
            </ul>
        </div>
    </>)
};

export default Sidebar;

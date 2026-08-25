import React, {useState } from "react";
import icon2 from "@/assets/FIRDAOUS STORE.png"
import { selectedLang } from "@/utils/i18n";
import { useTranslation } from "react-i18next";
import { useLangContext } from "@/contexts/LanguageContext";
import "./SidebarPhoneNav.css";
import { FaSignOutAlt, FaHome, FaTag } from "react-icons/fa";
import { MdLanguage, MdOutlineEmail, MdOutlineSettings } from "react-icons/md";
import { useAuth } from "@/contexts/Authentication";
import { useNavigate, useLocation } from "react-router-dom";
import { ImStatsDots } from "react-icons/im";
import { FaArrowDownWideShort } from "react-icons/fa6";
import { LiaShoePrintsSolid } from "react-icons/lia";
import { BsInboxesFill } from "react-icons/bs";
import { GrLanguage } from "react-icons/gr";


const SidebarPhoneNav : React.FC = () => {
    const {t} = useTranslation();
    const {signOut, user} = useAuth();
    const navigate = useNavigate();
    // FIX: same staleness issue as Sidebar.tsx — read reactively via
    // useLocation now that navigation is client-side, not a hard reload.
    const location = useLocation();
    const {currentLang, setCurrentLang} = useLangContext();
    const [sidebar, setSidebar] = useState<boolean>(false);
    const actual = location.pathname.slice(1);


    const SignOut = () => {

        signOut();
        navigate('/Login');
    }



    return(<>
<div className="shadow db-sidebar-phone-header p-2">

            <div className="sideBarIcon" onClick={()=>setSidebar(!sidebar)}>
                <div className="db-hamburger">
                <div className={sidebar?`db-sideBarIconLine1 active`:"db-sideBarIconLine1"}
                        onClick={()=>setSidebar(!sidebar)}></div>
                <div className={sidebar?`db-sideBarIconLine2 active`:"db-sideBarIconLine2"}
                        onClick={()=>setSidebar(!sidebar)}></div>
                <div className={sidebar?`db-sideBarIconLine3 active`:"db-sideBarIconLine3"}
                        onClick={()=>setSidebar(!sidebar)}></div>
                </div>
                <div className="fs-6 fw-bold text-center" style={{color:"#0e92e4"}}>{t('nav.menu')}</div>
            </div>

            <div className="icon-section">
                <a onClick={() => navigate("/Home")}>
                    <img className="icon1" src={icon2} alt="Icon" />
                </a>
            </div>

            <div className="db-lang-icon-div d-flex align-items-center">
                <GrLanguage  className="db-lang-icon" />
                <span className="db-lang-icon-text rounded" style={{backgroundColor:'#fff', color:"#0e92e4", direction:'rtl'}}>
                {currentLang}</span>
            </div>


            <nav className={`db-header-navbar ${sidebar&&"active"} ${selectedLang(currentLang)=="ar"&&'rtl'} shadow`}
                style={selectedLang(currentLang)==="ar"?{right:0}:{left:0}}>

        <div className="db-header-sidebar-user d-flex flex-column align-items-center">
            <div className="db-user-image">
                <img src={user?.image} style={{width:"100%", height:"100%"}}/>
            </div>
            <div className="db-user-name text-center fw-bold" style={{color:"#0782ce"}}>{user?.first_name} {user?.last_name}</div>
            <div className="db-user-name text-center fw-bold" style={{color:"#0782ce"}}>{t('admin.users.username')}: {user?.username}</div>
        </div>

        <ul className={`db-header-sidebar-list ${selectedLang(currentLang)=='ar'?'rtl':''} mt-1`}>
                    <li className="d-flex rounded " style={{zIndex:11000}}>
                    <MdLanguage size={20}/>
                        <select className="mx-1 sidebar-lang fw-bold"
                                onChange={(e)=>setCurrentLang(e.target.value)}
                                value={currentLang}
                                >
                            <option className="mx-2">
                                Français
                            </option>
                            <option className="mx-2">
                                العربية
                            </option>
                            <option className="mx-2">
                                English
                            </option>
                        </select>
            </li>
            <li className={`my-1 rounded ${actual.toLowerCase()=='home'&&'DbIsClicked'}`} onClick={()=>{navigate("/Home"); setSidebar(false);}}><FaHome className="me-2"/> {t('nav.home')} </li>
            <li className={`my-1 rounded ${actual.toLowerCase()=='orders'&&'DbIsClicked'}`} onClick={()=>{navigate("/Orders"); setSidebar(false);}}><BsInboxesFill className="me-2"/> {t('nav.orders')} </li>
            <li className={`my-1 rounded ${actual.toLowerCase()=='deficiency'&&'DbIsClicked'}`} onClick={()=>{navigate("/Deficiency"); setSidebar(false);}}><FaArrowDownWideShort className="me-2"/> {t('admin.deficiency.title')} </li>
            <li className={`my-1 rounded ${actual.toLowerCase()=='productmanager'&&'DbIsClicked'}`} onClick={()=>{navigate('/ProductManager'); setSidebar(false);}}><LiaShoePrintsSolid className="me-2"/> {t('admin.product.management')}</li>
            {user?.role !== 'delivery' && <li className={`my-1 rounded ${actual.toLowerCase()=='promotions'&&'DbIsClicked'}`} onClick={()=>{navigate('/Promotions'); setSidebar(false);}}><FaTag className="me-2"/> {t('nav.promotions')}</li>}
            <div className={`my-2 rounded db-sidebar-action db-statistics-btn ${actual.toLowerCase()=='statistics'&&'DbIsClicked'}`} onClick={()=>{navigate("/Statistics"); setSidebar(false);}}>
                <span className="db-sidebar-action-icon db-sidebar-action-icon--stats"><ImStatsDots/></span>
                <span>{t('nav.statistics')}</span>
            </div>
            {user?.role === 'admin' && (
            <div className={`my-2 rounded db-sidebar-action db-newsletter-btn ${actual.toLowerCase()=='newsletter'&&'DbIsClicked'}`} onClick={() => {navigate("/Newsletter"); setSidebar(false);}}>
                <span className="db-sidebar-action-icon db-sidebar-action-icon--newsletter"><MdOutlineEmail/></span>
                <span>{t('nav.newsletter') || 'Newsletter'}</span>
            </div>
            )}
            <div className={`my-2 rounded db-sidebar-action db-settings-btn ${actual.toLowerCase()=='settings'&&'DbIsClicked'}`} onClick={()=>{navigate("/Settings"); setSidebar(false);}}>
                <span className="db-sidebar-action-icon db-sidebar-action-icon--settings"><MdOutlineSettings/></span>
                <span>{t('nav.settings')}</span>
            </div>
            <div className="my-2 rounded db-sidebar-action db-signout" onClick={SignOut}>
                <span className="db-sidebar-action-icon db-sidebar-action-icon--signout"><FaSignOutAlt/></span>
                <span>{t('nav.signOut')}</span>
            </div>
        </ul>
            </nav>
{/* Always spans the full width now (fades via opacity in CSS instead of
    animating width), so it no longer needs a direction-dependent anchor. */}
<div className={`db-voidSectionSideBarReducer ${sidebar&&"active"}`}
onClick={()=>setSidebar(false)}></div>

</div>
    </>)
}

export default SidebarPhoneNav;

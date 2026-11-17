import React, { useEffect, useState } from "react";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import "../styles/settings.css";
import Accordion from "react-bootstrap/esm/Accordion";
import apiInstance from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useLangContext } from "../contexts/LanguageContext";
import { GiSettingsKnobs } from "react-icons/gi";
import { selectedLang } from "@/utils/i18n";
import { showToast } from "@/utils/toast";
import { usersRoles } from "@/constants/roles";
import { wait } from "@/utils/general";
import { useParametersContext } from "../contexts/ParametersContext";
import { useAuth } from "../contexts/Authentication";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import ModalBackdrop from "@/components/modals/ModalBackdrop";
import { FaPen, FaSpinner, FaTrash, FaUserShield } from "react-icons/fa6";
import {
    FaEnvelope,
    FaFacebook,
    FaInstagram,
    FaPhoneAlt,
    FaStore,
    FaTags,
    FaTiktok,
    FaUserPlus,
    FaUsers,
    FaWhatsapp,
    FaYoutube,
} from "react-icons/fa";
import { isAxiosError } from "axios";

const connecter = apiInstance;

const dashboardApiError = (error: unknown, fallback: string): string => {
    if (!isAxiosError(error)) return fallback;
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (!data) return fallback;
    if (typeof data.detail === 'string') return data.detail;
    const firstValue = Object.values(data)[0];
    if (typeof firstValue === 'string') return firstValue;
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0];
    return fallback;
};

const SettingsPanelTitle: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
}> = ({icon, title, description}) => (
    <span className="settings-panel-title">
        <span className="settings-panel-title__icon" aria-hidden>{icon}</span>
        <span className="settings-panel-title__copy">
            <strong>{title}</strong>
            <small>{description}</small>
        </span>
    </span>
);

const Settings : React.FC = () => {
    const {t} = useTranslation();
    const {user} = useAuth();
    const {currentLang} = useLangContext();
    const {productTypes = [], categories = {}} = useParametersContext();
    const isAdmin = user?.role === 'admin';
    const canManageStorefront = user?.role === 'admin' || user?.role === 'manager';
    const categoryCount = Object.values(categories).reduce((total, items) => total + items.length, 0);

    return(<>
        <Sidebar/>
        <div className={`db-settings ${selectedLang(currentLang)=='ar'&&'rtl'}`}>
            <DbHeader/>
            <main className="settings-page-content">
                <header className="settings-hero">
                    <div className="settings-hero__main">
                        <span className="settings-hero__icon" aria-hidden><GiSettingsKnobs/></span>
                        <div>
                            <span className="settings-hero__eyebrow">{t('settingsUi.eyebrow')}</span>
                            <h1>{t('settingsUi.title')}</h1>
                            <p>{t('settingsUi.description')}</p>
                        </div>
                    </div>
                    <div className="settings-hero__summary">
                        <div><strong>{productTypes.length}</strong><span>{t('settingsUi.types')}</span></div>
                        <div><strong>{categoryCount}</strong><span>{t('settingsUi.categories')}</span></div>
                        <div><strong>{isAdmin ? t('admin.users.admin_role') : t('admin.users.manager_role')}</strong><span>{t('settingsUi.access')}</span></div>
                    </div>
                </header>

                {canManageStorefront && (
                    <section className="settings-group">
                        <div className="settings-group__heading">
                            <span className="settings-group__icon settings-group__icon--store"><FaStore/></span>
                            <div>
                                <h2>{t('settingsUi.storefrontTitle')}</h2>
                                <p>{t('settingsUi.storefrontDescription')}</p>
                            </div>
                        </div>
                        <Accordion className="settings-accordion" defaultActiveKey="site-contact">
                            <Accordion.Item eventKey="site-contact" className="settings-panel">
                                <SiteContactSettings/>
                            </Accordion.Item>
                        </Accordion>
                    </section>
                )}

                <section className="settings-group">
                    <div className="settings-group__heading">
                        <span className="settings-group__icon settings-group__icon--catalog"><FaTags/></span>
                        <div>
                            <h2>{t('settingsUi.catalogTitle')}</h2>
                            <p>{t('settingsUi.catalogDescription')}</p>
                        </div>
                    </div>
                    <Accordion className="settings-accordion" defaultActiveKey="product-types">
                        <Accordion.Item eventKey="product-types" className="settings-panel">
                            <ProductTypes/>
                        </Accordion.Item>
                        <Accordion.Item eventKey="categories" className="settings-panel">
                            <ProductParameters param="categories"/>
                        </Accordion.Item>
                    </Accordion>
                </section>

                {isAdmin && (
                    <section className="settings-group">
                        <div className="settings-group__heading">
                            <span className="settings-group__icon settings-group__icon--team"><FaUsers/></span>
                            <div>
                                <h2>{t('settingsUi.teamTitle')}</h2>
                                <p>{t('settingsUi.teamDescription')}</p>
                            </div>
                        </div>
                        <Accordion className="settings-accordion" defaultActiveKey="users-list">
                            <Accordion.Item eventKey="users-list" className="settings-panel">
                                <DashboardUsersList/>
                            </Accordion.Item>
                            <Accordion.Item eventKey="add-user" className="settings-panel">
                                <Accordion.Header>
                                    <SettingsPanelTitle
                                        icon={<FaUserPlus/>}
                                        title={t('admin.users.add')}
                                        description={t('settingsUi.addUserDescription')}
                                    />
                                </Accordion.Header>
                                <Accordion.Body><AddUser/></Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </section>
                )}
            </main>
        </div>
    </>)
}


interface SiteSettingsData {
    contact_email: string;
    phone_number: string;
    facebook_url: string;
    instagram_url: string;
    whatsapp_url: string;
    tiktok_url: string;
    youtube_url: string;
    updated_at?: string;
}

const EMPTY_SITE_SETTINGS: SiteSettingsData = {
    contact_email: '',
    phone_number: '',
    facebook_url: '',
    instagram_url: '',
    whatsapp_url: '',
    tiktok_url: '',
    youtube_url: '',
};

const SiteContactSettings: React.FC = () => {
    const {t} = useTranslation();
    const [settings, setSettings] = useState<SiteSettingsData>(EMPTY_SITE_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        connecter.get<SiteSettingsData>('db/site-settings/')
            .then(({data}) => {
                if (active) setSettings({...EMPTY_SITE_SETTINGS, ...data});
            })
            .catch(() => {
                if (active) showToast(t('siteSettings.loadError'), 'error');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [t]);

    const updateField = (field: keyof SiteSettingsData, value: string) => {
        setSettings((current) => ({...current, [field]: value}));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            const payload = Object.fromEntries(
                Object.entries(settings)
                    .filter(([key]) => key !== 'updated_at')
                    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
            );
            const {data} = await connecter.patch<SiteSettingsData>('db/site-settings/', payload);
            setSettings({...EMPTY_SITE_SETTINGS, ...data});
            showToast(t('siteSettings.saved'), 'success');
        } catch {
            showToast(t('siteSettings.saveError'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const fields: Array<{
        key: keyof SiteSettingsData;
        label: string;
        placeholder: string;
        type: 'email' | 'tel' | 'url';
        icon: React.ReactNode;
        group: 'contact' | 'social';
    }> = [
        {key: 'contact_email', label: t('siteSettings.email'), placeholder: 'contact@example.com', type: 'email', icon: <FaEnvelope/>, group: 'contact'},
        {key: 'phone_number', label: t('siteSettings.phone'), placeholder: '+212 600 000 000', type: 'tel', icon: <FaPhoneAlt/>, group: 'contact'},
        {key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/your-page', type: 'url', icon: <FaFacebook/>, group: 'social'},
        {key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/your-page', type: 'url', icon: <FaInstagram/>, group: 'social'},
        {key: 'whatsapp_url', label: 'WhatsApp', placeholder: 'https://wa.me/212600000000', type: 'url', icon: <FaWhatsapp/>, group: 'social'},
        {key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@your-page', type: 'url', icon: <FaTiktok/>, group: 'social'},
        {key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@your-channel', type: 'url', icon: <FaYoutube/>, group: 'social'},
    ];

    const renderFields = (group: 'contact' | 'social') => (
        <div className="site-settings-grid">
            {fields.filter((field) => field.group === group).map((field) => (
                <label className="site-settings-field" key={field.key}>
                    <span className="site-settings-field__label">
                        <span className="site-settings-field__icon" aria-hidden>{field.icon}</span>
                        {field.label}
                    </span>
                    <input
                        className="form-control"
                        type={field.type}
                        value={settings[field.key] ?? ''}
                        placeholder={field.placeholder}
                        disabled={loading || saving}
                        onChange={(event) => updateField(field.key, event.target.value)}
                    />
                </label>
            ))}
        </div>
    );

    return (<>
        <Accordion.Header>
            <SettingsPanelTitle
                icon={<FaStore/>}
                title={t('siteSettings.title')}
                description={t('settingsUi.footerPanelDescription')}
            />
        </Accordion.Header>
        <Accordion.Body>
            <form className="site-settings-form" onSubmit={handleSubmit}>
                <p className="site-settings-intro">{t('siteSettings.description')}</p>

                <section className="site-settings-section">
                    <h3>{t('siteSettings.contactSection')}</h3>
                    {renderFields('contact')}
                </section>

                <section className="site-settings-section">
                    <div className="site-settings-section__heading">
                        <h3>{t('siteSettings.socialSection')}</h3>
                        <span>{t('siteSettings.optionalHint')}</span>
                    </div>
                    {renderFields('social')}
                </section>

                <div className="site-settings-actions">
                    <button className="btn btn-primary" type="submit" disabled={loading || saving}>
                        {loading ? t('ui.loading') : saving ? t('siteSettings.saving') : t('siteSettings.save')}
                    </button>
                    {settings.updated_at && !loading && (
                        <span className="site-settings-updated">
                            {t('siteSettings.lastUpdated', {date: new Date(settings.updated_at).toLocaleString()})}
                        </span>
                    )}
                </div>
            </form>
        </Accordion.Body>
    </>);
};


interface DashboardUserData {
    id: number;
    username: string;
    role: 'admin' | 'manager' | 'delivery';
    image?: string | null;
    first_name: string;
    last_name: string;
    email?: string;
    is_active: boolean;
    date_joined: string;
}

const DashboardUsersList: React.FC = () => {
    const {t} = useTranslation();
    const {user: currentUser} = useAuth();
    const {currentLang} = useLangContext();
    const [users, setUsers] = useState<DashboardUserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [editingUser, setEditingUser] = useState<DashboardUserData | null>(null);
    const [deletingUser, setDeletingUser] = useState<DashboardUserData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const {data} = await connecter.get<DashboardUserData[]>('db/users/');
            setUsers(data);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const roleLabel = (role: DashboardUserData['role']) => ({
        admin: t('admin.users.admin_role'),
        manager: t('admin.users.manager_role'),
        delivery: t('admin.users.deliveryMan'),
    })[role];

    const locale = selectedLang(currentLang) === 'ar'
        ? 'ar-MA'
        : selectedLang(currentLang) === 'fr' ? 'fr-MA' : 'en-GB';

    const handleDelete = async () => {
        if (!deletingUser) return;
        setDeleting(true);
        try {
            await connecter.delete(`db/users/${deletingUser.id}/`);
            setUsers((current) => current.filter((item) => item.id !== deletingUser.id));
            showToast(t('admin.users.deleted'), 'success');
            setDeletingUser(null);
        } catch (error: unknown) {
            showToast(dashboardApiError(error, t('admin.users.deleteError')), 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (<>
        <Accordion.Header>
            <SettingsPanelTitle
                icon={<FaUsers/>}
                title={t('admin.users.list')}
                description={t('admin.users.listDescription')}
            />
        </Accordion.Header>
        <Accordion.Body>
            <div className="settings-users-toolbar">
                <div>
                    <strong>{t('admin.users.staffCount', {count: users.length})}</strong>
                    <p>{t('admin.users.listDescription')}</p>
                </div>
            </div>

            {loading && (
                <div className="settings-users-grid" aria-label={t('ui.loading')}>
                    {[0, 1, 2].map((item) => <div className="settings-user-card settings-user-card--loading" key={item}/>) }
                </div>
            )}

            {!loading && loadError && (
                <div className="settings-users-error" role="alert">
                    <span>{t('admin.users.loadError')}</span>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadUsers}>
                        {t('admin.users.retry')}
                    </button>
                </div>
            )}

            {!loading && !loadError && users.length === 0 && (
                <p className="settings-users-empty">{t('admin.users.noUsers')}</p>
            )}

            {!loading && !loadError && users.length > 0 && (
                <div className="settings-users-grid">
                    {users.map((dashboardUser) => {
                        const fullName = `${dashboardUser.first_name} ${dashboardUser.last_name}`.trim();
                        const initials = (fullName || dashboardUser.username)
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join('');
                        const isCurrent = dashboardUser.id === currentUser?.id;

                        return (
                            <article className="settings-user-card" key={dashboardUser.id}>
                                <div className="settings-user-avatar" aria-hidden>
                                    {dashboardUser.image
                                        ? <img src={dashboardUser.image} alt=""/>
                                        : <span>{initials}</span>}
                                    <i className={dashboardUser.is_active ? 'is-active' : 'is-inactive'}/>
                                </div>
                                <div className="settings-user-details">
                                    <div className="settings-user-name-row">
                                        <h4>{fullName || dashboardUser.username}</h4>
                                        {isCurrent && <span className="settings-user-you">{t('admin.users.you')}</span>}
                                    </div>
                                    <p>@{dashboardUser.username}</p>
                                    {dashboardUser.email && <a href={`mailto:${dashboardUser.email}`}>{dashboardUser.email}</a>}
                                    <span className="settings-user-joined">
                                        {t('admin.users.joined', {
                                            date: new Intl.DateTimeFormat(locale, {dateStyle: 'medium'}).format(new Date(dashboardUser.date_joined)),
                                        })}
                                    </span>
                                </div>
                                <div className="settings-user-meta">
                                    <span className={`settings-user-role settings-user-role--${dashboardUser.role}`}>
                                        {roleLabel(dashboardUser.role)}
                                    </span>
                                    <span className={dashboardUser.is_active ? 'settings-user-status is-active' : 'settings-user-status is-inactive'}>
                                        {dashboardUser.is_active ? t('admin.users.active') : t('admin.users.inactive')}
                                    </span>
                                    <div className="settings-user-actions">
                                        <button
                                            type="button"
                                            className="settings-user-action settings-user-action--edit"
                                            onClick={() => setEditingUser(dashboardUser)}
                                            aria-label={`${t('admin.users.edit')} ${fullName || dashboardUser.username}`}
                                        >
                                            <FaPen aria-hidden/>
                                        </button>
                                        <button
                                            type="button"
                                            className="settings-user-action settings-user-action--delete"
                                            onClick={() => setDeletingUser(dashboardUser)}
                                            disabled={isCurrent}
                                            title={isCurrent ? t('admin.users.cannotDeleteSelf') : t('admin.users.delete')}
                                            aria-label={`${t('admin.users.delete')} ${fullName || dashboardUser.username}`}
                                        >
                                            <FaTrash aria-hidden/>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
            <EditDashboardUserModal
                user={editingUser}
                currentUserId={currentUser?.id}
                onClose={() => setEditingUser(null)}
                onSaved={(updated) => {
                    setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
                    setEditingUser(null);
                }}
            />
            <ConfirmDeleteModal
                open={deletingUser !== null}
                title={t('admin.users.deleteTitle')}
                message={t('admin.users.deleteWarning')}
                itemLabel={deletingUser ? `${deletingUser.first_name} ${deletingUser.last_name} (@${deletingUser.username})`.trim() : undefined}
                requireText={deletingUser?.username}
                requireTextLabel={t('admin.users.typeUsernameToDelete')}
                confirmLabel={t('admin.users.delete')}
                cancelLabel={t('ui.cancel')}
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setDeletingUser(null)}
            />
        </Accordion.Body>
    </>);
};


const EditDashboardUserModal: React.FC<{
    user: DashboardUserData | null;
    currentUserId?: number;
    onClose: () => void;
    onSaved: (user: DashboardUserData) => void;
}> = ({user, currentUserId, onClose, onSaved}) => {
    const {t} = useTranslation();
    const [draft, setDraft] = useState<DashboardUserData | null>(user);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setDraft(user);
        setPassword('');
        setPasswordConfirm('');
        setError('');
    }, [user]);

    if (!draft) return null;
    const isSelf = user?.id === currentUserId;
    const passwordMismatch = Boolean(password || passwordConfirm) && password !== passwordConfirm;

    const setField = <K extends keyof DashboardUserData>(field: K, value: DashboardUserData[K]) => {
        setDraft((current) => current ? {...current, [field]: value} : current);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (passwordMismatch) {
            setError(t('admin.users.passwordMismatch'));
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload: Record<string, unknown> = {
                username: draft.username.trim(),
                first_name: draft.first_name.trim(),
                last_name: draft.last_name.trim(),
                email: draft.email?.trim() ?? '',
                role: draft.role,
                is_active: draft.is_active,
            };
            if (password) payload.password = password;
            const {data} = await connecter.patch<DashboardUserData>(`db/users/${draft.id}/`, payload);
            showToast(t('admin.users.updated'), 'success');
            onSaved(data);
        } catch (apiError: unknown) {
            setError(dashboardApiError(apiError, t('admin.users.updateError')));
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalBackdrop
            onOpen={user !== null}
            onClose={onClose}
            dismissible={!saving}
            size="md"
            label={t('admin.users.editTitle')}
        >
            <form className="user-edit-modal" onSubmit={handleSubmit}>
                <header className="user-edit-modal__header">
                    <span><FaUserShield aria-hidden/></span>
                    <div>
                        <h2>{t('admin.users.editTitle')}</h2>
                        <p>{t('admin.users.editDescription')}</p>
                    </div>
                </header>

                {isSelf && <div className="user-edit-modal__notice">{t('admin.users.selfProtection')}</div>}
                {error && <div className="user-edit-modal__error" role="alert">{error}</div>}

                <div className="user-edit-modal__grid">
                    <label>
                        <span>{t('form.firstName.label')}</span>
                        <input className="form-control" value={draft.first_name} onChange={(e) => setField('first_name', e.target.value)} required/>
                    </label>
                    <label>
                        <span>{t('form.lastName.label')}</span>
                        <input className="form-control" value={draft.last_name} onChange={(e) => setField('last_name', e.target.value)} required/>
                    </label>
                    <label>
                        <span>{t('admin.users.username')}</span>
                        <input className="form-control" value={draft.username} onChange={(e) => setField('username', e.target.value)} required/>
                    </label>
                    <label>
                        <span>{t('form.email.label')}</span>
                        <input type="email" className="form-control" value={draft.email ?? ''} onChange={(e) => setField('email', e.target.value)}/>
                    </label>
                    <label>
                        <span>{t('admin.users.role')}</span>
                        <select className="form-select" value={draft.role} onChange={(e) => setField('role', e.target.value as DashboardUserData['role'])} disabled={isSelf}>
                            {usersRoles(t).map((role) => <option value={role.roleValue} key={role.roleValue}>{role.roleName}</option>)}
                        </select>
                    </label>
                    <label className="user-edit-modal__status">
                        <span>{t('admin.users.accountStatus')}</span>
                        <button
                            type="button"
                            className={draft.is_active ? 'user-status-toggle is-active' : 'user-status-toggle'}
                            onClick={() => setField('is_active', !draft.is_active)}
                            disabled={isSelf}
                            aria-pressed={draft.is_active}
                        >
                            <i/><b>{draft.is_active ? t('admin.users.active') : t('admin.users.inactive')}</b>
                        </button>
                    </label>
                </div>

                <div className="user-edit-modal__password">
                    <div>
                        <strong>{t('admin.users.passwordReset')}</strong>
                        <span>{t('admin.users.passwordOptional')}</span>
                    </div>
                    <div className="user-edit-modal__grid">
                        <label>
                            <span>{t('admin.users.newPassword')}</span>
                            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"/>
                        </label>
                        <label>
                            <span>{t('admin.users.confirmPassword')}</span>
                            <input type="password" className={`form-control ${passwordMismatch ? 'is-invalid' : ''}`} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} autoComplete="new-password"/>
                        </label>
                    </div>
                </div>

                <footer className="user-edit-modal__actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>{t('ui.cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={saving || passwordMismatch}>
                        {saving && <FaSpinner className="confirm-modal__spinner" aria-hidden/>}
                        {saving ? t('admin.users.saving') : t('admin.users.saveChanges')}
                    </button>
                </footer>
            </form>
        </ModalBackdrop>
    );
};


const ProductParameters : React.FC<{param:string}> = ({param}) => {
    const {t} = useTranslation();
    const {productTypes = [], categories = {}, refetchParameters} = useParametersContext();
    const capitalize = (str:string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const [valuesText, setValuesText] = useState("");
    const [selectedType, setSelectedType] = useState<string>("");
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedCategories: string[] = selectedType ? (categories?.[selectedType] ?? []) : [];

    const handlePostParameters = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = valuesText.split(",").map((v) => capitalize(v.trim())).filter((v) => v.length > 0);
        try {
            if(!selectedType){
                showToast(t('admin.product.selectTypeFirst'), "warning")
            } else {
                const response = await connecter.post("db/products/parameters/add", {
                    productType: selectedType, param: param, values: values
                })
                if(response.status == 201){
                    setValuesText("");
                    await refetchParameters();
                    showToast(t('admin.product.taxonomyAdded'), "success");
                }
            }
        } catch {
            showToast(t('admin.product.addFailed'), "error");
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedType || !categoryToDelete) return;
        setIsDeleting(true);
        try {
            await connecter.delete("db/products/categories/delete", {
                data: { productType: selectedType, name: categoryToDelete },
            });
            await refetchParameters();
            showToast(t('admin.product.categoryDeleted'), "success");
            setCategoryToDelete(null);
        } catch (error: unknown) {
            const message = isAxiosError(error) && error.response?.status === 409
                ? t('admin.product.categoryInUse')
                : t('admin.product.actionFailed');
            showToast(message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return(<>
        <Accordion.Header>
            <SettingsPanelTitle
                icon={<FaTags/>}
                title={t('admin.product.addCategories')}
                description={t('settingsUi.categoriesPanelDescription')}
            />
        </Accordion.Header>
        <Accordion.Body>
            <form onSubmit={handlePostParameters}>
                <div className="mb-3">
                    <label htmlFor="ref" className="form-label">{t('product.type')} :</label>
                    {productTypes.length > 0 ? (<>
                        <select className="form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                            <option value="">{t('admin.product.selectType')} </option>
                            {productTypes.map((type, index) => (
                                <option value={type} key={index}>{t(`productTypes.${type.toLowerCase()}`)}</option>
                            ))}
                        </select>
                    </>) : (<>
                        <input type="text" className="form-control" value={t('admin.product.noTypesYet')} disabled/>
                    </>)}
                </div>
                <div className="mb-3">
                    <label htmlFor="ref" className="form-label">{t('product.category')} :</label>
                    <input className="form-control" type="text" value={valuesText} onChange={(e) => setValuesText(e.target.value)} placeholder="ex: val1, val2, val3" required/>
                </div>
                <button type="submit" className="btn btn-primary">{t('form.submit')} </button>
            </form>
            {selectedType && (
                <div className="taxonomy-list-wrap">
                    <div className="taxonomy-list-title">{t('admin.product.existingCategories')}</div>
                    {selectedCategories.length > 0 ? (
                        <div className="taxonomy-list">
                            {selectedCategories.map((category) => (
                                <div className="taxonomy-chip" key={category}>
                                    <span>{category}</span>
                                    <button
                                        type="button"
                                        className="taxonomy-delete-btn"
                                        onClick={() => setCategoryToDelete(category)}
                                        aria-label={`${t('confirm.delete')} ${category}`}
                                    >
                                        <FaTrash aria-hidden />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-muted mb-0">{t('admin.product.noCategoryData')}</p>}
                </div>
            )}
        </Accordion.Body>
        <ConfirmDeleteModal
            open={categoryToDelete !== null}
            title={t('admin.product.deleteCategoryTitle')}
            message={t('admin.product.deleteCategoryWarning')}
            itemLabel={categoryToDelete ?? undefined}
            confirmLabel={t('confirm.delete')}
            cancelLabel={t('ui.cancel')}
            loading={isDeleting}
            onConfirm={handleDeleteCategory}
            onClose={() => setCategoryToDelete(null)}
        />
    </>)
};


const ProductTypes : React.FC = () => {
    const {t} = useTranslation();
    const {productTypes = [], productTypeDetails, refetchParameters} = useParametersContext();
    const [productTypeName, setProductTypeName] = useState("");
    const [productTypeTitleFr, setProductTypeTitleFr] = useState("");
    const [productTypeTitleAr, setProductTypeTitleAr] = useState("");
    const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePostParameters = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = [{
            name: productTypeName.trim(),
            title_fr: productTypeTitleFr.trim(),
            title_ar: productTypeTitleAr.trim(),
        }];
        try {
            const response = await connecter.post("db/products/types/add", { values: values })
            if(response.status == 201){
                setProductTypeName("");
                setProductTypeTitleFr("");
                setProductTypeTitleAr("");
                await refetchParameters();
                showToast(t('admin.product.taxonomyAdded'), "success");
            }
        } catch {
            showToast(t('admin.product.addFailed'), "error");
        }
    };

    const handleDeleteType = async () => {
        if (!typeToDelete) return;
        setIsDeleting(true);
        try {
            await connecter.delete("db/products/types/delete", { data: { name: typeToDelete } });
            await refetchParameters();
            showToast(t('admin.product.typeDeleted'), "success");
            setTypeToDelete(null);
        } catch (error: unknown) {
            const message = isAxiosError(error) && error.response?.status === 409
                ? t('admin.product.typeInUse')
                : t('admin.product.actionFailed');
            showToast(message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return(<>
        <Accordion.Header>
            <SettingsPanelTitle
                icon={<GiSettingsKnobs/>}
                title={t('admin.product.addTypes')}
                description={t('settingsUi.typesPanelDescription')}
            />
        </Accordion.Header>
        <Accordion.Body>
            <form onSubmit={handlePostParameters}>
                <div className="mb-3">
                    <label htmlFor="product-type-name" className="form-label">{t('admin.product.productTypeKey')} :</label>
                    <input id="product-type-name" className="form-control" type="text" value={productTypeName} onChange={(e) => setProductTypeName(e.target.value)} placeholder="Cap" required/>
                </div>
                <div className="mb-3">
                    <label htmlFor="product-type-title-fr" className="form-label">{t('admin.product.frenchTitle')} :</label>
                    <input id="product-type-title-fr" className="form-control" type="text" lang="fr" value={productTypeTitleFr} onChange={(e) => setProductTypeTitleFr(e.target.value)} placeholder="Casquettes" required/>
                </div>
                <div className="mb-3">
                    <label htmlFor="product-type-title-ar" className="form-label">{t('admin.product.arabicTitle')} :</label>
                    <input id="product-type-title-ar" className="form-control" type="text" lang="ar" dir="rtl" value={productTypeTitleAr} onChange={(e) => setProductTypeTitleAr(e.target.value)} placeholder="كاسكيطات" required/>
                </div>
                <button type="submit" className="btn btn-primary">{t('form.submit')} </button>
            </form>
            <div className="taxonomy-list-wrap">
                <div className="taxonomy-list-title">{t('admin.product.existingTypes')}</div>
                {productTypes.length > 0 ? (
                    <div className="taxonomy-list">
                        {productTypes.map((type) => (
                            <div className="taxonomy-chip" key={type}>
                                <span>
                                    <strong>{type}</strong>
                                    {productTypeDetails.find((detail) => detail.name === type)?.title_fr &&
                                        ` · ${productTypeDetails.find((detail) => detail.name === type)?.title_fr}`}
                                    {productTypeDetails.find((detail) => detail.name === type)?.title_ar &&
                                        ` · ${productTypeDetails.find((detail) => detail.name === type)?.title_ar}`}
                                </span>
                                <button
                                    type="button"
                                    className="taxonomy-delete-btn"
                                    onClick={() => setTypeToDelete(type)}
                                    aria-label={`${t('confirm.delete')} ${type}`}
                                >
                                    <FaTrash aria-hidden />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-muted mb-0">{t('admin.product.noTypesYet')}</p>}
            </div>
        </Accordion.Body>
        <ConfirmDeleteModal
            open={typeToDelete !== null}
            title={t('admin.product.deleteTypeTitle')}
            message={t('admin.product.deleteTypeWarning')}
            itemLabel={typeToDelete ?? undefined}
            confirmLabel={t('confirm.delete')}
            cancelLabel={t('ui.cancel')}
            loading={isDeleting}
            onConfirm={handleDeleteType}
            onClose={() => setTypeToDelete(null)}
        />
    </>)
};


const AddUser = () => {
    const {t} = useTranslation();
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [firstname, setFirstname] = useState<string>('');
    const [lastname, setLastname] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [image, setImage] = useState<File>();
    const [loading, setLoading] = useState<boolean>(false);
    const [passwordMatch, setPasswordMatch] = useState<boolean>();
    const [passwordsWritten, setPasswordsWritten] = useState<boolean>();

    useEffect(()=>{
        setPasswordMatch(password.trim() === confirmPassword.trim())
    },[password, confirmPassword])
    useEffect(()=>{
        setPasswordsWritten(password.trim() != "" && confirmPassword.trim() != "")
    }, [password, confirmPassword])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files){ setImage(e.target.files[0]); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!passwordMatch){
            showToast(t('admin.users.passwordMismatch'), "error");
            return
        }
        if(role == ''){
            showToast(t('admin.users.roleRequired'), "warning");
        } else {
            setLoading(true);
            const formData = new FormData();
            formData.append('first_name', firstname);
            formData.append('last_name', lastname);
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('role', role);
            if(image){ formData.append('image', image); }
            try {
                const response = await connecter.post('db/user/register', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if(response.status === 201){
                    showToast(t('admin.users.registrationSuccess'), "success");
                    await wait(1500);
                    window.location.reload();
                }
            } catch {
                showToast(t('admin.users.registrationError'), "error");
            }
            setLoading(false);
        }
    };

    return(<form onSubmit={handleSubmit}>
        <div className="mb-3">
            <label className="form-label">{t('form.firstName.label')} :</label>
            <input type="text" className="form-control" value={firstname} onChange={(e) => setFirstname(e.target.value)} required/>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('form.lastName.label')} :</label>
            <input type="text" className="form-control" value={lastname} onChange={(e) => setLastname(e.target.value)} required/>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('admin.users.username')} :</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required/>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('form.email.label')} :</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)}/>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('admin.users.password')} :</label>
            <input type="password"
                className={`form-control ${confirmPassword.trim() != "" ? passwordMatch ? "is-valid" : "" : ""}`}
                value={password} onChange={(e) => setPassword(e.target.value)} required/>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('admin.users.confirmPassword')} :</label>
            <input type="password"
                className={`form-control ${!passwordMatch ? "is-invalid" : passwordsWritten ? "is-valid" : ""}`}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
            <label className="form-label">{t('admin.users.role')} :</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value={''}>{t('admin.users.selectRole')} </option>
                {usersRoles(t).map((cat, index) => (
                    <option value={cat.roleValue} key={index}>{cat.roleName}</option>
                ))}
            </select>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('admin.product.mainImage')} :</label>
            <input type="file" className="form-control" onChange={handleImageChange} required/>
        </div>
        <button className="btn btn-primary" type="submit">
            {loading ? t('ui.loading') : t('form.submit')}
        </button>
    </form>)
}

export default Settings;

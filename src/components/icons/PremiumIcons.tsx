/**
 * ============================================================
 * BLACK DIAMOND APP - SISTEMA DE ICONOS PREMIUM MINIMALISTAS
 * ============================================================
 * 
 * Familia: Lucide React (Stroke Width: 1.5 para elegancia)
 * Estilo: Minimalista, líneas finas, espaciado generoso
 * Tamaño base: 20px (ajustable vía className)
 * 
 * REGLAS DE USO:
 * 1. SIEMPRE usar iconos de este archivo
 * 2. NO importar lucide-react directamente
 * 3. Mantener consistencia en stroke width
 * 4. Usar nombres semánticos (no técnicos)
 * ============================================================
 */

import {
  // ========== NAVEGACIÓN Y ACCIONES ==========
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  
  // ========== USUARIOS Y PERSONAS ==========
  User,
  UserPlus,
  UserMinus,
  UserX,
  Users,
  Crown,
  
  // ========== COMUNICACIÓN ==========
  MessageCircle,
  MessageSquare,
  Send,
  Mail,
  Phone,
  Video,
  
  // ========== COMERCIO Y FINANZAS ==========
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Package,
  Receipt,
  
  // ========== TIEMPO Y CALENDARIO ==========
  Clock,
  Calendar,
  Timer,
  History,
  
  // ========== ESTADO Y ACCIONES ==========
  Check,
  CheckCircle2,
  Circle,
  AlertCircle,
  Info,
  XCircle,
  AlertTriangle,
  
  // ========== EDICIÓN Y GESTIÓN ==========
  Edit3,
  Plus,
  Minus,
  Trash2,
  Save,
  Copy,
  Upload,
  Download,
  
  // ========== CONTENIDO Y MEDIA ==========
  Image,
  FileText,
  File,
  Folder,
  Camera,
  
  // ========== INTERFAZ Y UI ==========
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  Filter,
  Settings,
  Sliders,
  
  // ========== UBICACIÓN Y MAPAS ==========
  MapPin,
  Navigation,
  Home,
  Building2,
  
  // ========== ESTADÍSTICAS Y DATOS ==========
  BarChart3,
  PieChart,
  Activity,
  Award,
  Star,
  
  // ========== MISCELÁNEOS ==========
  Tag,
  Bell,
  BellOff,
  Archive,
  RotateCcw,
  RefreshCw,
  Zap,
  Sparkles,
  Gem,
  LogIn,
  LogOut,
  Radio,
  Wifi,
  
  // ========== ACCIONES DE SERVICIO ==========
  PlayCircle,
  StopCircle,
  PauseCircle,
  
  // ========== REACCIONES Y FEEDBACK ==========
  ThumbsUp,
  ThumbsDown,
  Heart,
  
  // ========== LOADER ==========
  Loader2,
} from 'lucide-react';

// ============================================================
// CONFIGURACIÓN BASE
// ============================================================

const ICON_CONFIG = {
  strokeWidth: 1.5, // Líneas finas para look premium
  size: 20,         // Tamaño base consistente
  className: '',    // Clase adicional opcional
};

// ============================================================
// COMPONENTE BASE PARA ICONOS
// ============================================================

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

// ============================================================
// CATEGORÍA: NAVEGACIÓN
// ============================================================

export const IconClose = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <X size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconBack = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ArrowLeft size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconNext = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ArrowRight size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconMenu = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Menu size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconMore = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <MoreHorizontal size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconExpand = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ChevronDown size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCollapse = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ChevronUp size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: USUARIOS Y PERFILES
// ============================================================

export const IconUser = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <User size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconUsers = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Users size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconAddUser = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <UserPlus size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconRemoveUser = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <UserMinus size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconVIP = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Crown size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: COMUNICACIÓN
// ============================================================

export const IconMessage = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <MessageCircle size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconChat = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <MessageSquare size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconSend = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Send size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconEmail = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Mail size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCall = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Phone size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconVideo = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Video size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: FINANZAS Y COMERCIO
// ============================================================

export const IconMoney = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <DollarSign size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCard = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <CreditCard size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconGrowth = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <TrendingUp size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDecline = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <TrendingDown size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconBag = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ShoppingBag size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconProduct = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Package size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconReceipt = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Receipt size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: TIEMPO
// ============================================================

export const IconTime = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Clock size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCalendar = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Calendar size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconTimer = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Timer size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconHistory = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <History size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: ESTADO Y FEEDBACK
// ============================================================

export const IconSuccess = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <CheckCircle2 size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCheck = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Check size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconWarning = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <AlertCircle size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDanger = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <AlertTriangle size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconError = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <XCircle size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconInfo = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Info size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: ACCIONES
// ============================================================

export const IconEdit = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Edit3 size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconAdd = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Plus size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconRemove = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Minus size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDelete = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Trash2 size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconSave = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Save size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCopy = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Copy size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconUpload = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Upload size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDownload = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Download size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: CONTENIDO
// ============================================================

export const IconImage = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Image size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconFile = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <FileText size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDocument = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <File size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconFolder = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Folder size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconCamera = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Camera size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: INTERFAZ
// ============================================================

export const IconView = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Eye size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconHide = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <EyeOff size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconLock = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Lock size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconUnlock = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Unlock size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconSearch = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Search size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconFilter = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Filter size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconSettings = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Settings size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconAdjust = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Sliders size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: UBICACIÓN
// ============================================================

export const IconLocation = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <MapPin size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconNavigate = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Navigation size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconHome = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Home size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconBuilding = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Building2 size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: ESTADÍSTICAS
// ============================================================

export const IconChart = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <BarChart3 size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconPie = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <PieChart size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconActivity = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Activity size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconAward = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Award size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconStar = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Star size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconRating = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Star size={size} strokeWidth={strokeWidth} className={className} fill="currentColor" />
);

// ============================================================
// CATEGORÍA: NOTIFICACIONES
// ============================================================

export const IconBell = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Bell size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconBellOff = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <BellOff size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: MISCELÁNEOS
// ============================================================

export const IconTag = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Tag size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconArchive = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Archive size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconRestore = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <RotateCcw size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconRefresh = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <RefreshCw size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconPower = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Zap size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconPremium = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Sparkles size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDiamond = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Gem size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconLogin = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <LogIn size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconLogout = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <LogOut size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconLive = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Radio size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconWifi = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Wifi size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: MEDIA CONTROLS
// ============================================================

export const IconPlay = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <PlayCircle size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconStop = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <StopCircle size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconPause = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <PauseCircle size={size} strokeWidth={strokeWidth} className={className} />
);

// ============================================================
// CATEGORÍA: FEEDBACK
// ============================================================

export const IconLike = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ThumbsUp size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconDislike = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <ThumbsDown size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconHeart = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Heart size={size} strokeWidth={strokeWidth} className={className} />
);

export const IconHeartFilled = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Heart size={size} strokeWidth={strokeWidth} className={className} fill="currentColor" />
);

// ============================================================
// CATEGORÍA: LOADING
// ============================================================

export const IconLoading = ({ size = 20, className = '', strokeWidth = 1.5 }: IconProps) => (
  <Loader2 size={size} strokeWidth={strokeWidth} className={`${className} animate-spin`} />
);

// ============================================================
// EXPORTAR TODO COMO DEFAULT PARA FÁCIL ACCESO
// ============================================================

const PremiumIcons = {
  // Navegación
  Close: IconClose,
  Back: IconBack,
  Next: IconNext,
  Menu: IconMenu,
  More: IconMore,
  Expand: IconExpand,
  Collapse: IconCollapse,
  
  // Usuarios
  User: IconUser,
  Users: IconUsers,
  AddUser: IconAddUser,
  RemoveUser: IconRemoveUser,
  VIP: IconVIP,
  
  // Comunicación
  Message: IconMessage,
  Chat: IconChat,
  Send: IconSend,
  Email: IconEmail,
  Call: IconCall,
  Video: IconVideo,
  
  // Finanzas
  Money: IconMoney,
  Card: IconCard,
  Growth: IconGrowth,
  Decline: IconDecline,
  Bag: IconBag,
  Product: IconProduct,
  Receipt: IconReceipt,
  
  // Tiempo
  Time: IconTime,
  Calendar: IconCalendar,
  Timer: IconTimer,
  History: IconHistory,
  
  // Estado
  Success: IconSuccess,
  Check: IconCheck,
  Warning: IconWarning,
  Danger: IconDanger,
  Error: IconError,
  Info: IconInfo,
  
  // Acciones
  Edit: IconEdit,
  Add: IconAdd,
  Remove: IconRemove,
  Delete: IconDelete,
  Save: IconSave,
  Copy: IconCopy,
  Upload: IconUpload,
  Download: IconDownload,
  
  // Contenido
  Image: IconImage,
  File: IconFile,
  Document: IconDocument,
  Folder: IconFolder,
  Camera: IconCamera,
  
  // Interfaz
  View: IconView,
  Hide: IconHide,
  Lock: IconLock,
  Unlock: IconUnlock,
  Search: IconSearch,
  Filter: IconFilter,
  Settings: IconSettings,
  Adjust: IconAdjust,
  
  // Ubicación
  Location: IconLocation,
  Navigate: IconNavigate,
  Home: IconHome,
  Building: IconBuilding,
  
  // Estadísticas
  Chart: IconChart,
  Pie: IconPie,
  Activity: IconActivity,
  Award: IconAward,
  Star: IconStar,
  Rating: IconRating,
  
  // Notificaciones
  Bell: IconBell,
  BellOff: IconBellOff,
  
  // Misceláneos
  Tag: IconTag,
  Archive: IconArchive,
  Restore: IconRestore,
  Refresh: IconRefresh,
  Power: IconPower,
  Premium: IconPremium,
  Diamond: IconDiamond,
  Login: IconLogin,
  Logout: IconLogout,
  Live: IconLive,
  Wifi: IconWifi,
  
  // Media Controls
  Play: IconPlay,
  Stop: IconStop,
  Pause: IconPause,
  
  // Feedback
  Like: IconLike,
  Dislike: IconDislike,
  Heart: IconHeart,
  HeartFilled: IconHeartFilled,
  
  // Loading
  Loading: IconLoading,
};

export default PremiumIcons;

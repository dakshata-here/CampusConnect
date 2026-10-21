import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, User as AppUser } from '../../types';
import brightCampusBg from '../../assets/images/bright-campus.jpg';
import darkCampusBg from '../../assets/images/dark-campus.jpg';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  RotateCw,
  Hash,
  UserPlus,
  Phone,
  GraduationCap,
  Briefcase,
  HelpCircle,
  X,
  Key,
  Info
} from 'lucide-react';
import { changePasswordApi, forgotPasswordApi, resetPasswordApi, clearToken } from '../../utils/api';


const ADMIN_SECURITY_QUESTIONS = [
  'Which is your favourite book?',
  'Who is your role model?',
  'Which is your favourite subject?',
  'What was the name of your first school?',
  'What is your favourite research domain or hobby?'
];

const DEFAULT_ADMIN_ANSWERS: Record<string, string> = {
  'Which is your favourite book?': 'Wings of Fire',
  'Who is your role model?': 'Dr. A. P. J. Abdul Kalam',
  'Which is your favourite subject?': 'Computer Networks & Security',
  'What was the name of your first school?': 'PICT Model School',
  'What is your favourite research domain or hobby?': 'Artificial Intelligence'
};

export const LoginPage: React.FC = () => {
  const {
    currentUser,
    allUsers,
    loginUser,
    setCurrentUser,
    registerUser,
    submitRegistrationRequest,
    registrationRequests,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    clubs,
    pendingPasswordChange,
    setPendingPasswordChange,
    completePasswordChange
  } = useApp();

  // Credential Recovery Modal State (Administrator-Managed Recovery)
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<'request' | 'reset'>('request');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset Token Form State
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mandatory First-Time Password Change State
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changeShowPassword, setChangeShowPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  // Sync temporary password when pendingPasswordChange arrives
  useEffect(() => {
    if (pendingPasswordChange?.currentPassword) {
      setChangeCurrentPassword(pendingPasswordChange.currentPassword);
    }
  }, [pendingPasswordChange]);


  // Mode: 'login' or 'register'
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');

  // Login Role Tab: student, lead, or admin
  const [activeLoginRole, setActiveLoginRole] = useState<'student' | 'lead' | 'admin'>('student');

  // Student Login Fields (PRN + Password + Captcha)
  const [studentPrn, setStudentPrn] = useState('PRN002');
  const [studentPassword, setStudentPassword] = useState('Admin@123');
  const [studentShowPassword, setStudentShowPassword] = useState(false);
  const [studentCaptchaChecked, setStudentCaptchaChecked] = useState(false);
  const [studentCaptchaLoading, setStudentCaptchaLoading] = useState(false);

  // Lead Login Fields (Student/Faculty selector + ID + Club + Password + Captcha)
  const [leadUserType, setLeadUserType] = useState<'student' | 'faculty'>('student');
  const [leadStudentPrn, setLeadStudentPrn] = useState('PRN001');
  const [leadFacultyId, setLeadFacultyId] = useState('FAC001');
  const [leadClub, setLeadClub] = useState(clubs[0]?.name || 'NSS Club');
  const [leadPassword, setLeadPassword] = useState('Admin@123');
  const [leadShowPassword, setLeadShowPassword] = useState(false);
  const [leadCaptchaChecked, setLeadCaptchaChecked] = useState(false);
  const [leadCaptchaLoading, setLeadCaptchaLoading] = useState(false);

  useEffect(() => {
    if (!leadClub && clubs.length > 0) {
      setLeadClub(clubs[0].name);
    }
  }, [clubs, leadClub]);
  // Admin Login Fields (Faculty ID + Password + 2-Step Security Verification + Captcha)
  const [adminFacultyId, setAdminFacultyId] = useState('ADM001');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  // Any one of the 5 security questions is selected automatically by the website
  const [initialAdminQIndex] = useState(() => Math.floor(Math.random() * ADMIN_SECURITY_QUESTIONS.length));
  const [adminQuestionIndex] = useState(initialAdminQIndex);
  const [adminSecurityAnswer, setAdminSecurityAnswer] = useState(() => {
    const q = ADMIN_SECURITY_QUESTIONS[initialAdminQIndex];
    return DEFAULT_ADMIN_ANSWERS[q] || 'Wings of Fire';
  });
  const [adminCaptchaChecked, setAdminCaptchaChecked] = useState(false);
  const [adminCaptchaLoading, setAdminCaptchaLoading] = useState(false);

  // Admin 5 Security Questions for Registration
  const [adminRegAnswers, setAdminRegAnswers] = useState<string[]>([
    '', '', '', '', ''
  ]);

  // -------------------------------------------------------------
  // REGISTRATION FORM TEMPLATE STATE (10 Requested Points)
  // -------------------------------------------------------------
  // 1. Full name
  const [regFullName, setRegFullName] = useState('');
  // 2. Role (Club Lead, Admin)
  const [regRole, setRegRole] = useState<'lead' | 'admin'>('lead');
  // Club Lead specific registration options
  const [regLeadType, setRegLeadType] = useState<'student' | 'faculty'>('student');
  const [regSelectedClub, setRegSelectedClub] = useState(clubs[0]?.name || 'PICT ACM Student Chapter');
  // 3. Email address
  const [regEmail, setRegEmail] = useState('');
  // 4. PRN no.
  const [regPrn, setRegPrn] = useState('');
  // 5. Year of Study (drop down)
  const [regYear, setRegYear] = useState('Third Year (TE)');
  // 6. Department (drop down)
  const [regDept, setRegDept] = useState('Computer Engineering');
  // 7. Mobile number
  const [regMobile, setRegMobile] = useState('');
  // 8. Create Password
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  // 9. I am not a robot (check box)
  const [regCaptchaChecked, setRegCaptchaChecked] = useState(false);
  const [regCaptchaLoading, setRegCaptchaLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password condition criteria for registration
  const hasMinLength = regPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(regPassword);
  const metRulesCount = (hasMinLength ? 1 : 0) + (hasUppercase ? 1 : 0) + (hasSpecialChar ? 1 : 0);
  const strengthPercent =
    regPassword.length === 0 ? 0 : metRulesCount === 3 ? 100 : metRulesCount === 2 ? 66 : 33;

  const getStrengthLabel = () => {
    if (regPassword.length === 0) return { label: 'Empty', color: 'text-slate-400' };
    if (metRulesCount === 3) return { label: 'Strong (100%)', color: 'text-emerald-600 dark:text-emerald-400' };
    if (metRulesCount === 2) return { label: 'Moderate (66%)', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Weak (33%)', color: 'text-rose-600 dark:text-rose-400' };
  };

  const getStrengthBarColor = () => {
    if (regPassword.length === 0) return 'bg-slate-200 dark:bg-slate-700';
    if (metRulesCount === 3) return 'bg-emerald-500';
    if (metRulesCount === 2) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Reusable Captcha Click Simulator
  const handleCaptchaToggle = (
    currentVal: boolean,
    setVal: (v: boolean) => void,
    setLoading: (l: boolean) => void
  ) => {
    if (currentVal) {
      setVal(false);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVal(true);
    }, 450);
  };

  const handleRoleTabChange = (role: 'student' | 'lead' | 'admin') => {
    setActiveLoginRole(role);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenRegistration = (preselectedRole?: 'lead' | 'admin') => {
    const roleToSet: 'lead' | 'admin' = preselectedRole || (activeLoginRole === 'admin' ? 'admin' : 'lead');
    setRegRole(roleToSet);
    setViewMode('register');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleBackToLogin = () => {
    setViewMode('login');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Helper to fetch security questions & answers for admin
  const getAdminQuestionsAndAnswers = (facultyId: string) => {
    const custom = localStorage.getItem(`admin_sec_${facultyId.trim().toLowerCase()}`);
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      } catch (err) {
        console.error(err);
      }
    }
    return ADMIN_SECURITY_QUESTIONS.map((q) => ({
      question: q,
      answer: DEFAULT_ADMIN_ANSWERS[q] || 'Wings of Fire'
    }));
  };

  const activeAdminQA = getAdminQuestionsAndAnswers(adminFacultyId);
  const currentAdminQuestion = activeAdminQA[adminQuestionIndex]?.question || ADMIN_SECURITY_QUESTIONS[0];
  const expectedAdminAnswer = activeAdminQA[adminQuestionIndex]?.answer || DEFAULT_ADMIN_ANSWERS[currentAdminQuestion];

  // Credential Recovery Handlers (Administrator-Managed Recovery)
  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      setRecoveryFeedback({ type: 'error', message: 'Please enter your PRN, Employee ID, or institutional email.' });
      return;
    }
    setRecoveryLoading(true);
    setRecoveryFeedback(null);
    try {
      const res = await forgotPasswordApi(recoveryIdentifier.trim());
      setRecoveryFeedback({
        type: 'success',
        message: res.message || 'Recovery request registered. Please contact your College Administrator to obtain your verified 15-minute reset token.'
      });
    } catch (err: any) {
      setRecoveryFeedback({
        type: 'error',
        message: err.message || 'Failed to submit recovery request.'
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);
    if (!resetToken.trim()) {
      setResetFeedback({ type: 'error', message: 'Please enter the reset token.' });
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (!(/[a-zA-Z]/.test(resetNewPassword) && /[0-9]/.test(resetNewPassword))) {
      setResetFeedback({ type: 'error', message: 'New password must contain both letters and numbers.' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setResetLoading(true);
    try {
      const res = await resetPasswordApi({
        token: resetToken.trim(),
        newPassword: resetNewPassword
      });
      setResetFeedback({
        type: 'success',
        message: res.message || 'Password reset successfully! Please log in with your new password.'
      });
      setResetToken('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err.message || 'Failed to reset password. Please verify the token is valid and unexpired.'
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Mandatory Password Change Handlers
  const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (!changeCurrentPassword) {
      setChangeError('Please enter your current temporary password.');
      return;
    }
    if (changeNewPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long.');
      return;
    }
    if (!(/[a-zA-Z]/.test(changeNewPassword) && /[0-9]/.test(changeNewPassword))) {
      setChangeError('New password must contain both letters and numbers.');
      return;
    }
    if (changeNewPassword === changeCurrentPassword) {
      setChangeError('New password must be different from your current temporary password.');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    setChangeLoading(true);
    try {
      const res = await changePasswordApi({
        currentPassword: changeCurrentPassword,
        newPassword: changeNewPassword
      });
      setChangeSuccess('Password updated successfully! Unlocking campus portal...');
      setTimeout(async () => {
        await completePasswordChange(res.user, res.token);
      }, 700);
    } catch (err: any) {
      setChangeError(err.message || 'Failed to update password.');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    clearToken();
    setPendingPasswordChange(null);
    setChangeCurrentPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setChangeError('');
    setChangeSuccess('');
  };

  // 1. STUDENT LOGIN SUBMISSION
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!studentCaptchaChecked) {
      setErrorMessage('Please verify that you are not a robot before proceeding.');
      return;
    }

    if (!studentPrn.trim()) {
      setErrorMessage('Please enter your Student PRN / Roll No.');
      return;
    }

    if (!studentPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const res = await loginUser(studentPrn.trim(), 'student', studentPassword);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid student credentials. Please check your PRN and Password.');
    }
  };

  // 2. CLUB LEAD LOGIN SUBMISSION
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!leadCaptchaChecked) {
      setErrorMessage('Please verify that you are not a robot before proceeding.');
      return;
    }

    const idToUse = leadUserType === 'student' ? leadStudentPrn.trim() : leadFacultyId.trim();
    if (!idToUse) {
      setErrorMessage(
        leadUserType === 'student'
          ? 'Please enter your Student PRN.'
          : 'Please enter your Employee ID.'
      );
      return;
    }

    // Check if registration is pending or rejected
    const pendingLead = registrationRequests.find(
      (r) =>
        (r.idNumber.toLowerCase() === idToUse.toLowerCase() ||
          r.email.toLowerCase() === idToUse.toLowerCase()) &&
        r.status === 'pending'
    );
    if (pendingLead) {
      setErrorMessage(
        'Your registration request is pending College Admin approval. You cannot access the dashboard until an administrator approves your registration.'
      );
      return;
    }

    const rejectedLead = registrationRequests.find(
      (r) =>
        (r.idNumber.toLowerCase() === idToUse.toLowerCase() ||
          r.email.toLowerCase() === idToUse.toLowerCase()) &&
        r.status === 'rejected'
    );
    if (rejectedLead) {
      setErrorMessage('Your registration request was rejected by the administrator.');
      return;
    }

    if (!leadClub.trim()) {
      setErrorMessage('Please select your club from the dropdown.');
      return;
    }

    if (!leadPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const res = await loginUser(idToUse, 'president', leadPassword, undefined, leadClub.trim());
    if (res.success) {
      setActiveTab('dashboard');
      return;
    }

    setErrorMessage(res.message || 'Invalid club lead credentials. Please check your ID, Club, and Password.');
  };

  // 3. ADMIN LOGIN SUBMISSION (Employee ID + Password + Two-Step Verification)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adminCaptchaChecked) {
      setErrorMessage('Please verify that you are not a robot before proceeding.');
      return;
    }

    if (!adminFacultyId.trim()) {
      setErrorMessage('Please enter your Employee ID or Admin Email.');
      return;
    }

    // Check if admin registration is pending or rejected
    const pendingAdmin = registrationRequests.find(
      (r) =>
        (r.idNumber.toLowerCase() === adminFacultyId.trim().toLowerCase() ||
          r.email.toLowerCase() === adminFacultyId.trim().toLowerCase()) &&
        r.status === 'pending'
    );
    if (pendingAdmin) {
      setErrorMessage(
        'Your registration request is pending College Admin approval. You cannot access the dashboard until an administrator approves your registration.'
      );
      return;
    }

    const rejectedAdmin = registrationRequests.find(
      (r) =>
        (r.idNumber.toLowerCase() === adminFacultyId.trim().toLowerCase() ||
          r.email.toLowerCase() === adminFacultyId.trim().toLowerCase()) &&
        r.status === 'rejected'
    );
    if (rejectedAdmin) {
      setErrorMessage('Your admin registration request was rejected by the administrator.');
      return;
    }

    if (!adminPassword) {
      setErrorMessage('Please enter your Admin Password.');
      return;
    }

    const res = await loginUser(
      adminFacultyId.trim(),
      'college_admin',
      adminPassword,
      adminSecurityAnswer.trim()
    );
    if (res.success) {
      setActiveTab('dashboard');
    } else {
      setErrorMessage(res.message || 'Admin verification failed. Please check your Employee ID and password.');
    }
  };

  // 10. CREATE ACCOUNT (REGISTRATION SUBMISSION)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regFullName.trim()) {
      setErrorMessage('Please fill in your full name.');
      return;
    }

    if (!regEmail.trim()) {
      setErrorMessage("Email address is required and must have '@gmail.com'.");
      return;
    }

    // Email validation: must have @gmail.com
    const emailTrimmed = regEmail.trim().toLowerCase();
    const hasGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailTrimmed);
    if (!hasGmail) {
      setErrorMessage("Email Address must have '@gmail.com' compulsory (e.g. yourname@gmail.com).");
      return;
    }

    if (!regPrn.trim()) {
      setErrorMessage(
        regRole === 'admin'
          ? 'Please enter your Employee ID.'
          : regRole === 'lead' && regLeadType === 'faculty'
          ? 'Please enter your Employee ID.'
          : 'Please enter your Student PRN or Employee ID.'
      );
      return;
    }

    // Mobile number validation (compulsory exactly 10 digits)
    const mobileDigits = regMobile.trim().replace(/\D/g, '');
    if (!mobileDigits) {
      setErrorMessage("Mobile number is compulsory for '10' digits.");
      return;
    }
    if (mobileDigits.length !== 10) {
      setErrorMessage("Mobile number must be compulsory for '10' digits.");
      return;
    }

    if (!regCaptchaChecked) {
      setErrorMessage('Please verify that you are not a robot before creating your account.');
      return;
    }

    // If Admin, validate that all 5 security questions are answered
    if (regRole === 'admin') {
      const missingIndex = adminRegAnswers.findIndex((ans) => !ans.trim());
      if (missingIndex !== -1) {
        setErrorMessage(
          `Please answer Question ${missingIndex + 1}: "${ADMIN_SECURITY_QUESTIONS[missingIndex]}" for 2-step verification.`
        );
        return;
      }

      // Persist the 5 security questions and answers
      const qaList = ADMIN_SECURITY_QUESTIONS.map((q, i) => ({
        question: q,
        answer: adminRegAnswers[i].trim()
      }));
      localStorage.setItem(`admin_sec_${regPrn.trim().toLowerCase()}`, JSON.stringify(qaList));
    }

    const roleToAssign: UserRole =
      regRole === 'admin' ? 'college_admin' : regRole === 'lead' ? 'president' : 'student';

    const qaList =
      regRole === 'admin'
        ? ADMIN_SECURITY_QUESTIONS.map((q, i) => ({
            question: q,
            answer: adminRegAnswers[i].trim()
          }))
        : undefined;

    const matchedClub = regRole === 'lead' ? clubs.find((c) => c.name === regSelectedClub) : undefined;

    const assignedYear =
      regRole === 'admin'
        ? 'Staff'
        : regRole === 'lead' && regLeadType === 'faculty'
        ? 'Faculty Coordinator'
        : regYear;

    const assignedDept =
      regRole === 'admin'
        ? 'Administration'
        : regRole === 'lead' && regLeadType === 'faculty'
        ? 'Faculty Advisor'
        : regDept;

    // For Club Lead or Admin, registration request goes to Admin dashboard and waits for approval
    if (regRole === 'lead' || regRole === 'admin') {
      submitRegistrationRequest({
        fullName: regFullName.trim(),
        role: regRole,
        leadType: regRole === 'lead' ? regLeadType : undefined,
        clubName: regRole === 'lead' ? (matchedClub?.name || regSelectedClub) : undefined,
        clubId: matchedClub?.id,
        email: regEmail.trim(),
        idNumber: regPrn.trim(),
        department: assignedDept,
        year: assignedYear,
        phone: regMobile.trim() || '+91 98000 00000',
        securityQuestions: qaList
      });

      if (regRole === 'admin') {
        setAdminFacultyId(regPrn.trim());
      } else {
        if (regLeadType === 'student') {
          setLeadStudentPrn(regPrn.trim());
        } else {
          setLeadFacultyId(regPrn.trim());
        }
      }

      setSuccessMessage(
        `Registration request submitted successfully! Your application as ${
          regRole === 'lead' ? 'Club Lead' : 'College Admin'
        } has been sent to the Admin Dashboard for approval. You will be able to access the dashboard once approved.`
      );

      setTimeout(() => {
        setViewMode('login');
      }, 2500);
      return;
    }

    const success = registerUser({
      name: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: roleToAssign,
      enrollmentNumber: regPrn.trim(),
      department: assignedDept,
      year: assignedYear,
      phone: regMobile.trim() || '+91 98000 00000',
      clubId: matchedClub?.id,
      clubName: matchedClub?.name || (regRole === 'lead' ? regSelectedClub : undefined),
      securityQuestions: qaList
    });

    if (success) {
      setSuccessMessage(`Account created successfully as Student! Entering portal...`);
      setTimeout(() => {
        setActiveTab('dashboard');
      }, 700);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* ========================================================================= */}
      {/* ADAPTIVE CAMPUS BACKGROUNDS (Bright Mode Day / Dark Mode Night) */}
      {/* ========================================================================= */}
      
      {/* 1. Bright Mode Campus Background Image (Daytime Campus with modern building & sunny plaza) */}
      <div 
        className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-500 ${
          isDarkMode ? 'opacity-0 pointer-events-none hidden' : 'opacity-100 block'
        }`}
      >
        <img 
          src={brightCampusBg} 
          alt="PICT Campus Daytime View" 
          referrerPolicy="no-referrer" 
          className="w-full h-full object-cover object-center"
        />
        {/* Soft edge ambient light tint */}
        <div className="absolute inset-0 bg-sky-900/5 pointer-events-none" />
      </div>

      {/* 2. Dark Mode Campus Background Image (Nighttime Campus with illuminated windows & reflective ground) */}
      <div 
        className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-500 ${
          isDarkMode ? 'opacity-100 block' : 'opacity-0 pointer-events-none hidden'
        }`}
      >
        <img 
          src={darkCampusBg} 
          alt="PICT Campus Night View" 
          referrerPolicy="no-referrer" 
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle evening atmosphere tint to enhance contrast while keeping campus glow visible */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* Micro Tech Grid Overlay (Harmonizes with the constellation graphics in the images) */}
      <div 
        className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38bdf80f_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80f_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_45%,#000_60%,transparent_100%)] pointer-events-none" 
      />



      {/* Top Header Bar */}
      <header className="bg-white/85 dark:bg-[#070b14]/85 backdrop-blur-md border-b border-sky-100/80 dark:border-sky-950/70 sticky top-0 z-30 shadow-xs dark:shadow-md dark:shadow-black/50 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-sky-500/25 shrink-0">
              P
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  Pune Institute of Computer Technology
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 hidden md:inline shrink-0">
                  CampusConnect
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-none">
                Official Campus Events & Academic Activities Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bright / Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 bg-white dark:bg-[#0a0f1d] text-xs font-semibold text-slate-700 dark:text-sky-200 hover:bg-sky-50/80 dark:hover:bg-[#10182c] transition-colors shadow-xs cursor-pointer"
              title={isDarkMode ? 'Switch to Bright Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Bright Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-sky-700" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative z-10 py-4 sm:py-8">
        <div className="w-full flex items-center justify-center">

          {/* ========================================================================= */}
          {/* VIEW 1: SIGN IN CARD (Role tabs: Student, Club Lead, Admin + New Registration button below) */}
          {/* ========================================================================= */}
          {viewMode === 'login' && (
            <div className="w-full max-w-md bg-white/70 dark:bg-[#060b18]/65 rounded-2xl border border-white/80 dark:border-sky-500/30 p-4 sm:p-8 shadow-[0_20px_50px_-12px_rgba(2,132,199,0.25),0_10px_25px_-5px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(56,189,248,0.2),0_0_0_1px_rgba(56,189,248,0.2)_inset] space-y-5 sm:space-y-6 transition-all backdrop-blur-xl backdrop-saturate-150 shrink-0">
            {/* Top Title & Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/80 dark:bg-sky-950/60 backdrop-blur-xs border border-sky-200/90 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Institutional Gateway</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Welcome to the CampusConnect Portal
              </h1>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sign in with your role credentials to access your dashboard
              </p>
            </div>

            {/* Role Tab Navigation (Student, Club Lead, Admin) */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-sky-100/50 dark:bg-[#040814]/70 backdrop-blur-xs border border-sky-200/60 dark:border-sky-900/50 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleRoleTabChange('student')}
                className={`py-2 px-2 rounded-lg transition-all text-center truncate cursor-pointer ${
                  activeLoginRole === 'student'
                    ? 'bg-white/90 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 shadow-xs font-bold border border-sky-200/70 dark:border-sky-500/40 backdrop-blur-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-200'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('lead')}
                className={`py-2 px-2 rounded-lg transition-all text-center truncate cursor-pointer ${
                  activeLoginRole === 'lead'
                    ? 'bg-white/90 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 shadow-xs font-bold border border-sky-200/70 dark:border-sky-500/40 backdrop-blur-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-200'
                }`}
              >
                Club Lead
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('admin')}
                className={`py-2 px-2 rounded-lg transition-all text-center truncate cursor-pointer ${
                  activeLoginRole === 'admin'
                    ? 'bg-white/90 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 shadow-xs font-bold border border-sky-200/70 dark:border-sky-500/40 backdrop-blur-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-200'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. STUDENT LOGIN FORM */}
            {activeLoginRole === 'student' && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* Student PRN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Student PRN *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={studentPrn}
                      onChange={(e) => setStudentPrn(e.target.value)}
                      placeholder="e.g. PRN002"
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80 font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryModalOpen(true);
                        setRecoveryTab('request');
                        setRecoveryFeedback(null);
                        setResetFeedback(null);
                      }}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={studentShowPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Enter student password"
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-9 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80"
                    />
                    <button
                      type="button"
                      onClick={() => setStudentShowPassword(!studentShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {studentShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Verification: "I am not a Robot" Captcha Checkbox Widget */}
                <div className="p-3 bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs rounded-xl border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between">
                  <div
                    onClick={() =>
                      handleCaptchaToggle(
                        studentCaptchaChecked,
                        setStudentCaptchaChecked,
                        setStudentCaptchaLoading
                      )
                    }
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        studentCaptchaChecked
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500 border-sky-500 dark:border-sky-400 text-white dark:text-slate-950 font-bold'
                          : 'bg-white dark:bg-[#080d1a] border-sky-300 dark:border-sky-900/80'
                      }`}
                    >
                      {studentCaptchaLoading ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-500 dark:text-sky-400" />
                      ) : studentCaptchaChecked ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      I am not a Robot
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center pl-2 text-slate-400 dark:text-slate-500">
                    <Shield className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                    <span className="text-[8px] uppercase tracking-wider font-bold">reCAPTCHA</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 dark:from-sky-400 dark:via-sky-500 dark:to-blue-600 dark:hover:from-sky-300 dark:hover:to-blue-500 text-white dark:text-slate-950 font-bold dark:font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 2. CLUB LEAD LOGIN FORM */}
            {activeLoginRole === 'lead' && (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                {/* Choose 'Student' or 'Faculty' for Club Lead */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Choose Role Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-sky-100/50 dark:bg-[#040814]/70 backdrop-blur-xs border border-sky-200/60 dark:border-sky-900/50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setLeadUserType('student')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        leadUserType === 'student'
                          ? 'bg-white/90 dark:bg-sky-950/90 text-sky-600 dark:text-sky-300 shadow-xs border border-sky-200/70 dark:border-sky-500/40'
                          : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeadUserType('faculty')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        leadUserType === 'faculty'
                          ? 'bg-white/90 dark:bg-sky-950/90 text-sky-600 dark:text-sky-300 shadow-xs border border-sky-200/70 dark:border-sky-500/40'
                          : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Faculty</span>
                    </button>
                  </div>
                </div>

                {/* Conditional PRN or Faculty ID */}
                {leadUserType === 'student' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Student PRN *
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={leadStudentPrn}
                        onChange={(e) => setLeadStudentPrn(e.target.value)}
                        placeholder="e.g. PRN001"
                        className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Employee ID *
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={leadFacultyId}
                        onChange={(e) => setLeadFacultyId(e.target.value)}
                        placeholder="e.g. FAC001"
                        className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Club */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Club *
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={leadClub}
                      onChange={(e) => setLeadClub(e.target.value)}
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-8 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80 cursor-pointer"
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryModalOpen(true);
                        setRecoveryTab('request');
                        setRecoveryFeedback(null);
                        setResetFeedback(null);
                      }}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={leadShowPassword ? 'text' : 'password'}
                      required
                      value={leadPassword}
                      onChange={(e) => setLeadPassword(e.target.value)}
                      placeholder="Enter club authorization password"
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-9 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80"
                    />
                    <button
                      type="button"
                      onClick={() => setLeadShowPassword(!leadShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {leadShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Verification: "I am not a Robot" Captcha Checkbox Widget */}
                <div className="p-3 bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs rounded-xl border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between">
                  <div
                    onClick={() =>
                      handleCaptchaToggle(
                        leadCaptchaChecked,
                        setLeadCaptchaChecked,
                        setLeadCaptchaLoading
                      )
                    }
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        leadCaptchaChecked
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500 border-sky-500 dark:border-sky-400 text-white dark:text-slate-950 font-bold'
                          : 'bg-white dark:bg-[#080d1a] border-sky-300 dark:border-sky-900/80'
                      }`}
                    >
                      {leadCaptchaLoading ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-500 dark:text-sky-400" />
                      ) : leadCaptchaChecked ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      I am not a Robot
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center pl-2 text-slate-400 dark:text-slate-500">
                    <Shield className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                    <span className="text-[8px] uppercase tracking-wider font-bold">reCAPTCHA</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 dark:from-sky-400 dark:via-sky-500 dark:to-blue-600 dark:hover:from-sky-300 dark:hover:to-blue-500 text-white dark:text-slate-950 font-bold dark:font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In as Club Lead</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Club Lead New Registration Option directly below Club Lead login form */}
                <div className="pt-3 border-t border-sky-200/60 dark:border-sky-900/60 text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Applying to represent or lead a student club?
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenRegistration('lead')}
                    className="w-full py-2.5 px-4 rounded-xl border border-sky-200/80 dark:border-sky-800/60 bg-white/60 hover:bg-white/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs backdrop-blur-xs group"
                  >
                    <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>New Registration</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. ADMIN LOGIN FORM */}
            {activeLoginRole === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Employee ID *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={adminFacultyId}
                      onChange={(e) => setAdminFacultyId(e.target.value)}
                      placeholder="e.g. ADM001 or admin@campusconnect.edu"
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-950/90 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80 font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryModalOpen(true);
                        setRecoveryTab('request');
                        setRecoveryFeedback(null);
                        setResetFeedback(null);
                      }}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={adminShowPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-9 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-950/90 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80"
                    />
                    <button
                      type="button"
                      onClick={() => setAdminShowPassword(!adminShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {adminShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Two-Step Verification: Security Question */}
                <div className="p-3.5 bg-sky-50/70 dark:bg-[#070d1d]/80 backdrop-blur-xs rounded-xl border border-sky-200/80 dark:border-sky-900/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Two-Step Verification Question *
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-[#0b1329]/70 px-2.5 py-1.5 rounded-md border border-sky-100 dark:border-sky-900/50">
                    "{currentAdminQuestion}"
                  </p>

                  <div className="relative">
                    <HelpCircle className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={adminSecurityAnswer}
                      onChange={(e) => setAdminSecurityAnswer(e.target.value)}
                      placeholder="Enter your security answer..."
                      className="w-full bg-white/70 dark:bg-[#060a14]/80 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Answer one of the 5 security questions saved at registration. (Demo answer: <span className="font-semibold text-sky-600 dark:text-sky-400">{expectedAdminAnswer}</span>)
                  </p>
                </div>

                {/* Verification: "I am not a Robot" Captcha Checkbox Widget */}
                <div className="p-3 bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs rounded-xl border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between">
                  <div
                    onClick={() =>
                      handleCaptchaToggle(
                        adminCaptchaChecked,
                        setAdminCaptchaChecked,
                        setAdminCaptchaLoading
                      )
                    }
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        adminCaptchaChecked
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500 border-sky-500 dark:border-sky-400 text-white dark:text-slate-950 font-bold'
                          : 'bg-white dark:bg-[#080d1a] border-sky-300 dark:border-sky-900/80'
                      }`}
                    >
                      {adminCaptchaLoading ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-500 dark:text-sky-400" />
                      ) : adminCaptchaChecked ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      I am not a Robot
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center pl-2 text-slate-400 dark:text-slate-500">
                    <Shield className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                    <span className="text-[8px] uppercase tracking-wider font-bold">reCAPTCHA</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 dark:from-sky-400 dark:via-sky-500 dark:to-blue-600 dark:hover:from-sky-300 dark:hover:to-blue-500 text-white dark:text-slate-950 font-bold dark:font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In as College Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Repositioned Admin New Registration Option directly below Admin login form */}
                <div className="pt-3 border-t border-sky-200/60 dark:border-sky-900/60 text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Need to request a College Administrator account?
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenRegistration('admin')}
                    className="w-full py-2.5 px-4 rounded-xl border border-sky-200/80 dark:border-sky-800/60 bg-white/60 hover:bg-white/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs backdrop-blur-xs group"
                  >
                    <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>New Registration</span>
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Security Note */}
            <div className="text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Protected by PICT Multi-Role Role-Based Access Control (RBAC)
              </p>
            </div>
          </div>
        )}



        {/* ========================================================================= */}
        {/* VIEW 2: NEW REGISTRATION TEMPLATE */}
        {/* ========================================================================= */}
        {viewMode === 'register' && (
          <div className="w-full max-w-xl bg-white/70 dark:bg-[#060b18]/65 rounded-2xl border border-white/80 dark:border-sky-500/30 p-4 sm:p-8 shadow-[0_20px_50px_-12px_rgba(2,132,199,0.25),0_10px_25px_-5px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.8)_inset] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(56,189,248,0.2),0_0_0_1px_rgba(56,189,248,0.2)_inset] space-y-5 transition-all backdrop-blur-xl backdrop-saturate-150 shrink-0">
            {/* Header & Back Link */}
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-950/80 pb-4">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/70 border border-sky-200/90 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-[11px] font-semibold">
                {regRole === 'admin' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <span>College Administrator Registration</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <span>Club Lead Registration</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {regRole === 'admin' ? 'Administrator Registration' : 'Club Lead Registration'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {regRole === 'admin'
                  ? 'Complete the administrator registration form to establish your verified institutional profile.'
                  : 'Submit a registration request to lead a student club or technical society.'}
              </p>
            </div>

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* REGISTRATION FORM */}
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={regRole === 'admin' ? 'e.g. Dr. S. K. Kulkarni' : 'e.g. Sneha Kulkarni'}
                    className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80"
                  />
                </div>
              </div>

              {/* Club Lead Options: Student or Faculty selector + Select Club dropdown option */}
              {regRole === 'lead' && (
                <div className="space-y-3 p-3.5 bg-sky-50/60 dark:bg-[#070d1d]/70 rounded-xl border border-sky-200/80 dark:border-sky-900/60">
                  {/* Student or Faculty option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Coordinator Type (Student or Faculty) *
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/70 dark:bg-[#060b18]/80 border border-sky-200/70 dark:border-sky-900/50 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setRegLeadType('student')}
                        className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          regLeadType === 'student'
                            ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegLeadType('faculty')}
                        className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          regLeadType === 'faculty'
                            ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Faculty</span>
                      </button>
                    </div>
                  </div>

                  {/* Select Club dropdown option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Club *
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={regSelectedClub}
                        onChange={(e) => setRegSelectedClub(e.target.value)}
                        className="w-full bg-white/80 dark:bg-[#060a14]/80 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 cursor-pointer"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Address & PRN / Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="e.g. sneha.k@gmail.com"
                      className={`w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border ${
                        regEmail.trim() && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(regEmail.trim())
                          ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-400 focus:border-rose-400'
                          : 'border-sky-200/80 dark:border-sky-900/60 focus:ring-sky-400 focus:border-sky-400'
                      } focus:outline-none focus:ring-1 focus:bg-white/80 dark:focus:bg-[#0a1226]/80`}
                    />
                  </div>
                  {regEmail.trim() && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(regEmail.trim()) && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Email Address must have &apos;@gmail.com&apos; compulsory</span>
                    </p>
                  )}
                </div>

                {/* PRN / Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {regRole === 'admin'
                      ? 'Employee ID *'
                      : regRole === 'lead'
                      ? regLeadType === 'faculty'
                        ? 'Employee ID *'
                        : 'Student PRN or Employee ID *'
                      : 'Student PRN *'}
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regPrn}
                      onChange={(e) => setRegPrn(e.target.value)}
                      placeholder={
                        regRole === 'admin'
                          ? 'e.g. PICT-ADM-108'
                          : regRole === 'lead'
                          ? regLeadType === 'faculty'
                            ? 'e.g. PICT-EMP-401'
                            : 'e.g. C2K2210012 or PICT-EMP-401'
                          : 'e.g. C2K241099'
                      }
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Year of Study & Department (for Club Lead who is Student) */}
              {regRole === 'lead' && regLeadType === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Year of Study */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Year of Study *
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs px-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80"
                    >
                      <option value="First Year (FE)">First Year (FE)</option>
                      <option value="Second Year (SE)">Second Year (SE)</option>
                      <option value="Third Year (TE)">Third Year (TE)</option>
                      <option value="Final Year (BE)">Final Year (BE)</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Department *
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs px-3 py-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 focus:bg-white/80 dark:focus:bg-[#0a1226]/80"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Telecommunication">Electronics & Telecom (E&TC)</option>
                      <option value="Artificial Intelligence & Data Science">AI & Data Science (AI&DS)</option>
                      <option value="Electronics and Computer Engineering">Electronics and Computer Engineering</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-sky-500/80 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    value={regMobile}
                    onChange={(e) => {
                      // Disallow writing more than 10 numbers and allow digits only
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setRegMobile(digitsOnly);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="e.g. 9876543210 (10 digits)"
                    className={`w-full bg-white/50 dark:bg-[#070d1d]/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border ${
                      regMobile.trim() && regMobile.replace(/\D/g, '').length !== 10
                        ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-400 focus:border-rose-400'
                        : 'border-sky-200/80 dark:border-sky-900/60 focus:ring-sky-400 focus:border-sky-400'
                    } focus:outline-none focus:ring-1 focus:bg-white/80 dark:focus:bg-[#0a1226]/80`}
                  />
                </div>
                {regMobile.trim() && regMobile.replace(/\D/g, '').length !== 10 && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Mobile number must be compulsory for &apos;10&apos; digits ({regMobile.length}/10 entered)</span>
                  </p>
                )}
              </div>

              {/* 5 Security Questions for Admin 2-Step Verification */}
              {regRole === 'admin' && (
                <div className="p-4 bg-sky-50/80 dark:bg-[#070d1d]/85 rounded-xl border border-sky-200/90 dark:border-sky-900/80 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        5 Security Questions (Mandatory for Admin Two-Step Verification) *
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Answer all 5 questions below. Any one question will be randomly prompted during your Admin logins to verify your identity.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {ADMIN_SECURITY_QUESTIONS.map((question, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {idx + 1}. {question} *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminRegAnswers[idx]}
                          onChange={(e) => {
                            const updated = [...adminRegAnswers];
                            updated[idx] = e.target.value;
                            setAdminRegAnswers(updated);
                          }}
                          placeholder={`Your answer for: ${question}`}
                          className="w-full bg-white/70 dark:bg-[#060a14]/80 backdrop-blur-xs text-slate-900 dark:text-slate-100 text-xs px-3 py-2 rounded-lg border border-sky-200/80 dark:border-sky-900/60 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* I am not a robot (check box) */}
              <div className="p-3 bg-sky-50/40 dark:bg-[#050812] rounded-xl border border-sky-200/80 dark:border-sky-950/80 flex items-center justify-between">
                <div
                  onClick={() =>
                    handleCaptchaToggle(
                      regCaptchaChecked,
                      setRegCaptchaChecked,
                      setRegCaptchaLoading
                    )
                  }
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      regCaptchaChecked
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500 border-sky-500 dark:border-sky-400 text-white dark:text-slate-950 font-bold'
                        : 'bg-white dark:bg-[#080d1a] border-sky-300 dark:border-sky-900/80'
                    }`}
                  >
                    {regCaptchaLoading ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-500 dark:text-sky-400" />
                    ) : regCaptchaChecked ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    I am not a robot
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center pl-2 text-slate-400 dark:text-slate-500">
                  <Shield className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                  <span className="text-[8px] uppercase tracking-wider font-bold">reCAPTCHA</span>
                </div>
              </div>

              {/* Create account Button */}
              <button
                type="submit"
                disabled={regRole === 'admin' && metRulesCount < 3 && regPassword.length > 0}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 ${
                  regRole !== 'admin' || metRulesCount === 3 || regPassword.length === 0
                    ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 dark:from-sky-400 dark:via-sky-500 dark:to-blue-600 dark:hover:from-sky-300 dark:hover:to-blue-500 text-white dark:text-slate-950 dark:font-extrabold cursor-pointer'
                    : 'bg-sky-600/60 dark:bg-sky-500/30 text-white/80 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {regRole === 'admin' ? 'Submit Administrator Registration' : 'Submit Club Lead Registration'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Return to Login */}
            <div className="pt-2 text-center border-t border-sky-100 dark:border-sky-950/80">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                Already have an account? Sign In here
              </button>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Institutional Accreditation Footer */}
      <footer className="relative z-20 bg-white/85 dark:bg-[#060a12]/85 backdrop-blur-md border-t border-sky-100/80 dark:border-sky-950/80 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© 2026 Pune Institute of Computer Technology. Autonomous Institute affiliated to SPPU.</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 dark:text-slate-300">NAAC 'A+' Accredited</span>
            <span>•</span>
            <span>AICTE Approved</span>
            <span>•</span>
            <span>Support: events@pict.edu</span>
          </div>
        </div>
      </footer>
      {/* ========================================================= */}
      {/* 1. CREDENTIAL RECOVERY MODAL (Administrator-Managed Recovery) */}
      {/* ========================================================= */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0b1329]/95 backdrop-blur-md rounded-2xl border border-sky-200/80 dark:border-sky-900/70 shadow-2xl p-6 sm:p-7 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsRecoveryModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Credential Recovery
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Institutional Intranet Password Reset Service
                </p>
              </div>
            </div>

            {/* Network Policy & Email Delivery Disclaimer */}
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="leading-relaxed">
                <p className="font-semibold mb-0.5">Campus Network Notice (Zero External Email Delivery):</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Public outbound SMTP email is intentionally not configured on this internal server.
                  Password resets require verified, single-use, 15-minute expiring tokens issued directly by your College Administrator (Room 108 / admin@pict.edu).
                </p>
              </div>
            </div>

            {/* Recovery Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setRecoveryTab('request');
                  setRecoveryFeedback(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  recoveryTab === 'request'
                    ? 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                1. Request Token
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryTab('reset');
                  setResetFeedback(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  recoveryTab === 'reset'
                    ? 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                2. Reset with Token
              </button>
            </div>

            {/* TAB 1: Request Token */}
            {recoveryTab === 'request' && (
              <form onSubmit={handleRecoveryRequest} className="space-y-4">
                {recoveryFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      recoveryFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {recoveryFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    )}
                    <span className="leading-relaxed">{recoveryFeedback.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Student PRN, Employee ID, or Institutional Email *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="e.g. C2K2310142, PICT-ADM-108, or user@pict.edu"
                      className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200 dark:border-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {recoveryLoading ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Record Recovery Request in Audit Log</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryTab('reset');
                      setRecoveryFeedback(null);
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    Already have your token from College Admin? Go to Reset Form →
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Reset with Token */}
            {recoveryTab === 'reset' && (
              <form onSubmit={handleResetWithToken} className="space-y-3.5">
                {resetFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      resetFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {resetFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    )}
                    <span className="leading-relaxed">{resetFeedback.message}</span>
                  </div>
                )}

                {/* Reset Token Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Single-Use Reset Token (15-Minute Expiry) *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste 64-character token issued by College Admin"
                      className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200 dark:border-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password (Min 8 Characters, Letters & Numbers) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={resetShowPassword ? 'text' : 'password'}
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Create secure permanent password"
                      className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-9 py-2.5 rounded-lg border border-sky-200 dark:border-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => setResetShowPassword(!resetShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {resetShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={resetShowPassword ? 'text' : 'password'}
                      required
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-200 dark:border-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Verify Token & Invalidate Prior Sessions</span>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MANDATORY FIRST-TIME PASSWORD CHANGE MODAL */}
      {/* ========================================================= */}
      {pendingPasswordChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0b1329] rounded-2xl border-2 border-amber-400/80 dark:border-amber-500/80 shadow-2xl p-6 sm:p-7 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Mandatory Password Change
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Temporary Credential Detected
                </p>
              </div>
            </div>

            {/* Targeted User Information */}
            <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingPasswordChange.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Identifier / Email:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{pendingPasswordChange.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Role:</span>
                <span className="uppercase text-[10px] tracking-wider font-bold text-sky-600 dark:text-sky-400">
                  {pendingPasswordChange.user.role}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Your account is configured with an initial or temporary credential. For security compliance and to protect institutional records, you must create a new permanent password before access to campus features is permitted.
            </p>

            {/* Form */}
            <form onSubmit={handleMandatoryPasswordChange} className="space-y-3.5">
              {changeError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{changeError}</span>
                </div>
              )}

              {changeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{changeSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Temporary Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={changeCurrentPassword}
                    onChange={(e) => setChangeCurrentPassword(e.target.value)}
                    placeholder="Enter the temporary credential"
                    className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Permanent Password (Min 8 Chars, Alphanumeric) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={changeShowPassword ? 'text' : 'password'}
                    required
                    value={changeNewPassword}
                    onChange={(e) => setChangeNewPassword(e.target.value)}
                    placeholder="Choose a strong permanent password"
                    className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-9 py-2.5 rounded-lg border border-sky-300 dark:border-sky-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setChangeShowPassword(!changeShowPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {changeShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={changeShowPassword ? 'text' : 'password'}
                    required
                    value={changeConfirmPassword}
                    onChange={(e) => setChangeConfirmPassword(e.target.value)}
                    placeholder="Repeat permanent password"
                    className="w-full bg-slate-50 dark:bg-[#070d1d] text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-300 dark:border-sky-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel & Sign Out
                </button>
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="flex-2 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {changeLoading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Update Password & Enter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

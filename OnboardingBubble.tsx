import React, { useState, useEffect } from 'react';
import type { PerfilDocente, NivelEducativo, MateriaSecundaria, CampoFormativo } from './types';
import { CAMPOS_FORMATIVOS, MAPEO_MATERIA_CAMPO, MATERIAS_SECUNDARIA } from './constants';
import Typewriter from './Typewriter';

interface Props {
  onComplete: (profile: PerfilDocente) => void;
  existingProfile: PerfilDocente | null;
}

const OnboardingBubble: React.FC<Props> = ({ onComplete, existingProfile }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<PerfilDocente>>(existingProfile || {});
  const [showContent, setShowContent] = useState(false);
  
  const initialQuestions = [
    "¡Hola! Soy Atemi, tu asistente para la Nueva Escuela Mexicana. Vamos a configurar tu perfil.",
    "Para empezar, ¿prefieres una configuración guiada o eres un usuario avanzado?",
    "Perfecto. ¿Eres docente de Educación Básica en México?",
    "Genial. ¿En qué nivel educativo trabajas?",
    "¿Cuál es tu materia principal?", // Conditional for secundaria
    "¿Cuál es tu nombre completo?",
    "¿En qué escuela o CCT laboras?",
    "¿Para qué ciclo escolar es esta planeación? (ej. 2025-2026)",
    "Revisa tu perfil. ¿Es correcta la información?",
  ];

  const [question, setQuestion] = useState(initialQuestions[0]);

  const handleNextStep = (data: Partial<PerfilDocente>) => {
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    
    let nextStep = step + 1;
    // Skip subject question if not secundaria
    if (step === 3 && newFormData.nivel !== 'secundaria') {
      nextStep++; 
    }
    
    setStep(nextStep);
    setShowContent(false);
  };
  
  useEffect(() => {
    let questionIndex = step;
    if (step > 4) questionIndex++; // Adjust index after subject step
    if (formData.nivel !== 'secundaria' && step >= 4) {
      questionIndex = step;
    }
    setQuestion(initialQuestions[questionIndex] || initialQuestions[8]);
  }, [step, formData.nivel]);

  const handleConfirm = () => {
    let campoFormativo: CampoFormativo | CampoFormativo[];
    if (formData.nivel === 'secundaria' && formData.materia) {
      campoFormativo = MAPEO_MATERIA_CAMPO[formData.materia];
    } else {
      campoFormativo = [...CAMPOS_FORMATIVOS];
    }

    const finalProfile: PerfilDocente = {
      configuracion: formData.configuracion || 'guiada',
      esDocente: formData.esDocente || true,
      nivel: formData.nivel!,
      materia: formData.materia,
      campoFormativo: campoFormativo,
      nombre: formData.nombre!,
      escuela: formData.escuela!,
      cicloEscolar: formData.cicloEscolar!,
    };
    onComplete(finalProfile);
  };

  const renderStepContent = () => {
    if (!showContent) return null;
    
    switch (step) {
      case 1: // Configuración
        return (
          <div className="flex gap-4 mt-6">
            <button className="btn btn-primary flex-1" onClick={() => handleNextStep({ configuracion: 'guiada' })}>Configuración Guiada</button>
            <button className="btn btn-secondary flex-1" onClick={() => handleNextStep({ configuracion: 'avanzado' })}>Usuario Avanzado</button>
          </div>
        );
      case 2: // esDocente
        return (
          <div className="flex gap-4 mt-6">
            <button className="btn btn-primary flex-1" onClick={() => handleNextStep({ esDocente: true })}>Sí, soy docente</button>
            <button className="btn btn-secondary flex-1" onClick={() => handleNextStep({ esDocente: false })}>No</button>
          </div>
        );
      case 3: // Nivel
        return (
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button className="btn btn-primary flex-1" onClick={() => handleNextStep({ nivel: 'preescolar' })}>Preescolar</button>
            <button className="btn btn-primary flex-1" onClick={() => handleNextStep({ nivel: 'primaria' })}>Primaria</button>
            <button className="btn btn-primary flex-1" onClick={() => handleNextStep({ nivel: 'secundaria' })}>Secundaria</button>
          </div>
        );
      case 4: // Materia (only if secundaria)
        if (formData.nivel !== 'secundaria') return null;
        return (
          <div className="mt-6">
            <select
              className="select-field"
              onChange={(e) => handleNextStep({ materia: e.target.value as MateriaSecundaria })}
              defaultValue=""
              aria-label="Selecciona tu materia"
            >
              <option value="" disabled>Selecciona una materia...</option>
              {MATERIAS_SECUNDARIA.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        );
      case 5: case 6: case 7: // Inputs
        const fieldKey = step === 5 ? 'nombre' : step === 6 ? 'escuela' : 'cicloEscolar';
        return (
          <form className="mt-6" onSubmit={(e) => { e.preventDefault(); handleNextStep({ [fieldKey]: (e.target as any)[fieldKey].value }); }}>
            <input
              id={fieldKey}
              name={fieldKey}
              type="text"
              className="input-field"
              autoFocus
              required
            />
            <button type="submit" className="btn btn-primary mt-4 w-full">Siguiente</button>
          </form>
        );
      case 8: // Summary
        return (
          <div className="mt-4 space-y-2 text-sm text-gray-300">
            <p><strong>Nombre:</strong> {formData.nombre}</p>
            <p><strong>Escuela/CCT:</strong> {formData.escuela}</p>
            <p><strong>Ciclo Escolar:</strong> {formData.cicloEscolar}</p>
            <p><strong>Nivel:</strong> {formData.nivel}</p>
            {formData.materia && <p><strong>Materia:</strong> {formData.materia}</p>}
            <div className="flex gap-4 mt-6">
              <button className="btn btn-primary flex-1" onClick={handleConfirm}>Confirmar</button>
              <button className="btn btn-secondary flex-1" onClick={() => { setStep(0); setFormData({}); }}>Volver al inicio</button>
            </div>
          </div>
        );
      default:
        return (
          <div className="mt-6">
            <button className="btn btn-primary w-full" onClick={() => handleNextStep({})}>Comenzar</button>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      style={{ animation: 'fadeIn 0.5s ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div 
        className="bg-gray-900/60 backdrop-blur-lg border border-[#8A1538]/50 rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl shadow-[#39FF14]/10"
        style={{ animation: 'slideInUp 0.5s ease-out' }}
      >
        <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold text-[#39FF14]">
          <Typewriter text={question} onComplete={() => setShowContent(true)} />
        </h2>
        <div className="min-h-[6rem]">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingBubble;

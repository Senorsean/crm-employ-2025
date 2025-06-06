import * as pdfjsLib from 'pdfjs-dist';
import { CVData } from '../types/cv';

// Fonction principale d'extraction et de parsing
export async function parseCV(file: File): Promise<CVData> {
  const text = await extractTextFromPDF(file);
  return parseText(text);
}

// Fonction d'extraction du texte
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

// Fonction de parsing du texte
function parseText(text: string): CVData {
  const data: CVData = {
    experiences: [],
    education: [],
    skills: [],
    languages: []
  };

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.email = emailMatch[0];

  // Téléphone
  const phoneMatch = text.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/);
  if (phoneMatch) data.phone = phoneMatch[0];

  // Nom et prénom
  const nameMatch = text.match(/^([A-ZÉÈÊËÀÂÎÏÔÛÙÜ\s-]+)\s+([A-ZÉÈÊËÀÂÎÏÔÛÙÜ\s-]+)/m);
  if (nameMatch) {
    data.firstName = nameMatch[1].trim();
    data.lastName = nameMatch[2].trim();
  }

  // Titre/Poste
  const titleMatch = text.match(/(?:Poste|Titre|Position)\s*:\s*([^\n]+)/i);
  if (titleMatch) data.title = titleMatch[1].trim();

  // Expériences
  const expSection = text.match(/Expériences?\s+professionnelles?[\s\S]*?(?=Formation|$)/i);
  if (expSection) {
    const experiences = expSection[0].split(/\n(?=[A-Z])/);
    data.experiences = experiences
      .filter(exp => exp.trim().length > 0)
      .map(exp => {
        const lines = exp.trim().split('\n');
        return {
          title: lines[0] || '',
          company: lines[1] || '',
          period: lines.find(l => /\d{4}/.test(l)) || '',
          description: lines.slice(2).join('\n').trim()
        };
      });
  }

  // Formation
  const eduSection = text.match(/Formation[\s\S]*?(?=Compétences|$)/i);
  if (eduSection) {
    const education = eduSection[0].split(/\n(?=[A-Z])/);
    data.education = education
      .filter(edu => edu.trim().length > 0)
      .map(edu => {
        const lines = edu.trim().split('\n');
        return {
          degree: lines[0] || '',
          school: lines[1] || '',
          year: lines.find(l => /\d{4}/.test(l)) || ''
        };
      });
  }

  // Compétences
  const skillsSection = text.match(/Compétences[\s\S]*?(?=Langues|$)/i);
  if (skillsSection) {
    data.skills = skillsSection[0]
      .split(/[,•|\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 2 && !/Compétences/i.test(skill));
  }

  // Langues
  const langSection = text.match(/Langues[\s\S]*?(?=\n\n|$)/i);
  if (langSection) {
    data.languages = langSection[0]
      .split(/[,•|\n]/)
      .map(lang => lang.trim())
      .filter(lang => lang.length > 2 && !/Langues/i.test(lang));
  }

  return data;
}
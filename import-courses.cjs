const fs = require('fs').promises;
const path = require('path');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function extractAreaFromTitle(titulo) {
  const areaMapping = {
    'excel': 'Informática',
    'powerpoint': 'Informática',
    'informatica': 'Informática',
    'windows': 'Informática',
    'office': 'Informática',
    'business intelligence': 'Informática',
    'power bi': 'Informática',
    'design': 'Design',
    'oratoria': 'Comunicação',
    'comunicacao': 'Comunicação',
    'apresentacao': 'Comunicação',
    'diccao': 'Comunicação',
    'desinibicao': 'Comunicação',
    'barbeiro': 'Beleza e Estética',
    'estetica': 'Beleza e Estética',
    'beleza': 'Beleza e Estética'
  };

  const tituloLower = titulo.toLowerCase();
  
  for (const [keyword, area] of Object.entries(areaMapping)) {
    if (tituloLower.includes(keyword)) {
      return area;
    }
  }
  
  return 'Outros';
}

function extractLocationFromTitle(titulo) {
  const locations = ['São Luís', 'Imperatriz', 'Bacabal', 'Santa Ines', 'Caxias', 'Timon'];
  
  for (const location of locations) {
    if (titulo.includes(location)) {
      return location;
    }
  }
  
  return '';
}

function cleanTitle(titulo) {
  const locations = ['São Luís', 'Imperatriz', 'Bacabal', 'Santa Ines', 'Caxias', 'Timon'];
  let cleanedTitle = titulo;
  
  for (const location of locations) {
    cleanedTitle = cleanedTitle.replace(` – ${location}`, '').replace(` - ${location}`, '');
  }
  
  return cleanedTitle.trim();
}

function isValidCourse(senacCourse) {
  const invalidTitles = [
    'Cursos',
    'Inscreva-se',
    'Ver mais',
    'Presencial',
    'Para VocêCursosPSG'
  ];
  
  return !invalidTitles.some(invalid => 
    senacCourse.titulo.toLowerCase().includes(invalid.toLowerCase())
  ) && senacCourse.titulo.length > 3;
}

async function importSenacCourses() {
  try {
    const jsonPath = 'c:/Users/freed/OneDrive/Documentos/app-teste-vocacional-ia/cursos_senac_sao_luis_20251001_142735.json';
    const outputPath = path.join(process.cwd(), 'data', 'courses.json');
    
    console.log('Importando cursos do SENAC...');
    
    // Ler arquivo JSON
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const senacCourses = JSON.parse(jsonData);
    
    const processedCourses = [];
    const seenTitles = new Set();
    
    for (const senacCourse of senacCourses) {
      if (!isValidCourse(senacCourse)) {
        continue;
      }
      
      const cleanedTitle = cleanTitle(senacCourse.titulo);
      
      // Evitar duplicatas baseado no título limpo
      if (seenTitles.has(cleanedTitle.toLowerCase())) {
        continue;
      }
      seenTitles.add(cleanedTitle.toLowerCase());
      
      const location = extractLocationFromTitle(senacCourse.titulo);
      const area = senacCourse.area || extractAreaFromTitle(senacCourse.titulo);
      
      const course = {
        id: generateId(),
        nome: cleanedTitle,
        area: area,
        descricao: location ? `Curso oferecido em ${location}. Mais informações: ${senacCourse.url}` : `Mais informações: ${senacCourse.url}`,
        nivel: 'basico',
        modalidade: 'presencial',
        duracao: '',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      processedCourses.push(course);
    }
    
    // Garantir que o diretório existe
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Salvar cursos processados
    await fs.writeFile(outputPath, JSON.stringify(processedCourses, null, 2), 'utf-8');
    
    console.log('✅ Importação concluída!');
    console.log(`📊 Total de cursos importados: ${processedCourses.length}`);
    console.log(`📁 Arquivo salvo em: ${outputPath}`);
    
    // Mostrar alguns exemplos
    console.log('\n📋 Exemplos de cursos importados:');
    processedCourses.slice(0, 5).forEach((course, index) => {
      console.log(`${index + 1}. ${course.nome} (Área: ${course.area})`);
    });
    
    return {
      imported: processedCourses.length,
      courses: processedCourses
    };
    
  } catch (error) {
    console.error('❌ Erro na importação:', error.message);
    throw error;
  }
}

// Executar importação
importSenacCourses()
  .then(() => {
    console.log('\n🎉 Processo de importação finalizado com sucesso!');
  })
  .catch((error) => {
    console.error('💥 Falha na importação:', error);
    process.exit(1);
  });
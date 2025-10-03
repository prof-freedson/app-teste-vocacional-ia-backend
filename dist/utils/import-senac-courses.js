import fs from "fs/promises";
import path from "path";
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function extractAreaFromTitle(titulo) {
    // Mapear títulos para áreas baseado no conteúdo
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
    // Remove localização do título
    const locations = ['São Luís', 'Imperatriz', 'Bacabal', 'Santa Ines', 'Caxias', 'Timon'];
    let cleanedTitle = titulo;
    for (const location of locations) {
        cleanedTitle = cleanedTitle.replace(` – ${location}`, '').replace(` - ${location}`, '');
    }
    return cleanedTitle.trim();
}
function isValidCourse(senacCourse) {
    // Filtrar apenas cursos válidos
    const invalidTitles = [
        'Cursos',
        'Inscreva-se',
        'Ver mais',
        'Presencial',
        'Para VocêCursosPSG'
    ];
    return !invalidTitles.some(invalid => senacCourse.titulo.toLowerCase().includes(invalid.toLowerCase())) && senacCourse.titulo.length > 3;
}
export async function importSenacCourses(jsonFilePath) {
    try {
        const jsonData = await fs.readFile(jsonFilePath, 'utf-8');
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
        return processedCourses;
    }
    catch (error) {
        console.error('Erro ao importar cursos do SENAC:', error);
        throw new Error(`Falha ao importar cursos: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function importAndSaveSenacCourses(jsonFilePath, outputPath) {
    try {
        const courses = await importSenacCourses(jsonFilePath);
        // Garantir que o diretório existe
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        // Salvar cursos processados
        await fs.writeFile(outputPath, JSON.stringify(courses, null, 2), 'utf-8');
        return {
            imported: courses.length,
            courses
        };
    }
    catch (error) {
        console.error('Erro ao importar e salvar cursos:', error);
        throw error;
    }
}
//# sourceMappingURL=import-senac-courses.js.map
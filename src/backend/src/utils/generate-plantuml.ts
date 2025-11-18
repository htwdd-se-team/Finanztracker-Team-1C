import * as fs from "fs";
import * as path from "path";

interface SpelunkerModule {
  name: string;
  imports: string[];
  providers: Record<string, { method: string; injections?: string[] }>;
  controllers: string[];
  exports: string[];
}

interface ClassInfo {
  name: string;
  properties: string[];
  methods: string[];
}

/**
 * Parses a Mermaid class diagram file and extracts class information
 */
function parseMermaidFile(mermaidPath: string): Map<string, ClassInfo> {
  const classMap = new Map<string, ClassInfo>();

  if (!fs.existsSync(mermaidPath)) {
    return classMap;
  }

  const content = fs.readFileSync(mermaidPath, "utf-8");
  const lines = content.split("\n");

  let currentClass: ClassInfo | null = null;
  let inClassBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match class definition: class ClassName{
    const classMatch = trimmed.match(/^class\s+(\w+)\s*\{/);
    if (classMatch) {
      const className = classMatch[1];
      currentClass = {
        name: className,
        properties: [],
        methods: [],
      };
      inClassBlock = true;
      continue;
    }

    // Match closing brace
    if (trimmed === "}" && currentClass) {
      if (
        currentClass.properties.length > 0 ||
        currentClass.methods.length > 0
      ) {
        classMap.set(currentClass.name, currentClass);
      }
      currentClass = null;
      inClassBlock = false;
      continue;
    }

    // Parse class content
    if (inClassBlock && currentClass) {
      // Match properties: -property: Type or +property: Type
      const propertyMatch = trimmed.match(/^([+-])(\w+):\s*(.+)$/);
      if (propertyMatch) {
        const visibility = propertyMatch[1] === "+" ? "+" : "-";
        const propName = propertyMatch[2];
        const propType = propertyMatch[3].trim();
        currentClass.properties.push(`${visibility}${propName}: ${propType}`);
        continue;
      }

      // Match methods: +method() ReturnType or +method() Promise~Type~
      const methodMatch = trimmed.match(/^([+-])(\w+)\(\)\s*(.+)$/);
      if (methodMatch) {
        const visibility = methodMatch[1] === "+" ? "+" : "-";
        const methodName = methodMatch[2];
        let returnType = methodMatch[3].trim();
        // Clean up Promise~Type~ to Promise<Type>
        returnType = returnType.replace(/~([^~]+)~/g, "<$1>");
        currentClass.methods.push(
          `${visibility}${methodName}(): ${returnType}`,
        );
        continue;
      }
    }
  }

  return classMap;
}

/**
 * Generates a PlantUML class diagram from NestJS Spelunker module analysis
 * Optionally loads class details from a Mermaid file
 */
export function generatePlantUMLFromSpelunker(
  modules: SpelunkerModule[],
  outputPath: string,
  mermaidPath?: string,
): void {
  const outputDir = path.dirname(outputPath);
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load class details from Mermaid file if provided
  const classDetails = mermaidPath
    ? parseMermaidFile(mermaidPath)
    : new Map<string, ClassInfo>();

  let puml = "@startuml\n";
  puml += "' Auto-generated NestJS Module Dependency Diagram\n";
  puml += "' Generated from nestjs-spelunker analysis\n";
  puml += "!theme plain\n";
  puml += "skinparam packageStyle rectangle\n";
  puml += "skinparam linetype ortho\n\n";

  // Track unique modules (handle duplicates)
  const uniqueModules = new Map<string, SpelunkerModule>();
  for (const module of modules) {
    const existing = uniqueModules.get(module.name);
    if (!existing) {
      uniqueModules.set(module.name, module);
    } else {
      // Merge if duplicate (can happen with dynamic modules)
      // Merge providers
      Object.assign(existing.providers, module.providers);
      // Merge controllers
      existing.controllers = [
        ...new Set([...existing.controllers, ...module.controllers]),
      ];
      // Merge exports
      existing.exports = [...new Set([...existing.exports, ...module.exports])];
      // Merge imports
      existing.imports = [...new Set([...existing.imports, ...module.imports])];
    }
  }

  const moduleList = Array.from(uniqueModules.values());

  // List of NestJS library modules that should be treated as external libraries
  const nestjsLibraryModules = [
    "JwtModule",
    "TypedConfigModule",
    "ScheduleModule",
  ];

  // Generate packages for each module
  for (const module of moduleList) {
    const isNestJsLibrary = nestjsLibraryModules.includes(module.name);

    puml += `package "${module.name}" {\n`;

    // For NestJS library modules, just add a note and skip internal services
    if (isNestJsLibrary) {
      puml += `  note right : NestJS Library Module\n`;
      if (module.exports.length > 0) {
        puml += `  note right : Exports: ${module.exports.join(", ")}\n`;
      }
    } else {
      // Add controllers
      if (module.controllers.length > 0) {
        for (const controller of module.controllers) {
          const classInfo = classDetails.get(controller);
          if (
            classInfo &&
            (classInfo.properties.length > 0 || classInfo.methods.length > 0)
          ) {
            puml += `  class ${controller} <<Controller>> {\n`;
            // Add properties
            for (const prop of classInfo.properties) {
              puml += `    ${prop}\n`;
            }
            // Add methods
            for (const method of classInfo.methods) {
              puml += `    ${method}\n`;
            }
            puml += `  }\n`;
          } else {
            puml += `  class ${controller} <<Controller>>\n`;
          }
        }
      }

      // Add providers
      const providerNames = Object.keys(module.providers);
      if (providerNames.length > 0) {
        for (const provider of providerNames) {
          let stereotype = "<<Service>>";
          if (provider.includes("Guard")) {
            stereotype = "<<Guard>>";
          } else if (provider.includes("Strategy")) {
            stereotype = "<<Strategy>>";
          } else if (
            provider.includes("Module") ||
            provider.includes("CONFIG")
          ) {
            stereotype = "<<Config>>";
          }

          const classInfo = classDetails.get(provider);
          if (
            classInfo &&
            (classInfo.properties.length > 0 || classInfo.methods.length > 0)
          ) {
            puml += `  class ${provider} ${stereotype} {\n`;
            // Add properties
            for (const prop of classInfo.properties) {
              puml += `    ${prop}\n`;
            }
            // Add methods
            for (const method of classInfo.methods) {
              puml += `    ${method}\n`;
            }
            puml += `  }\n`;
          } else {
            puml += `  class ${provider} ${stereotype}\n`;
          }
        }
      }

      // Add exports (if any)
      if (module.exports.length > 0) {
        puml += `  note right : Exports: ${module.exports.join(", ")}\n`;
      }
    }

    puml += "}\n\n";
  }

  // Generate dependencies between modules
  puml += "' Module Dependencies\n";
  for (const module of moduleList) {
    for (const importedModule of module.imports) {
      // Only draw if the imported module exists in our list
      if (uniqueModules.has(importedModule)) {
        puml += `"${module.name}" --> "${importedModule}" : imports\n`;
      }
    }
  }

  puml += "\n";

  // Generate relationships: Controllers use Services
  puml += "' Controller-Service Relationships\n";
  for (const module of moduleList) {
    for (const controller of module.controllers) {
      const providerNames = Object.keys(module.providers);
      for (const provider of providerNames) {
        // Only show relationships to services (not guards/strategies/config)
        if (
          !provider.includes("Guard") &&
          !provider.includes("Strategy") &&
          !provider.includes("Module") &&
          !provider.includes("CONFIG")
        ) {
          puml += `${controller} --> ${provider}\n`;
        }
      }
    }
  }

  puml += "\n";

  // Generate provider dependencies (injections)
  // Skip dependencies for NestJS library modules
  puml += "' Provider Dependencies\n";
  for (const module of moduleList) {
    // Skip provider dependencies for NestJS library modules
    if (nestjsLibraryModules.includes(module.name)) {
      continue;
    }

    for (const [providerName, providerInfo] of Object.entries(
      module.providers,
    )) {
      if (providerInfo.injections && providerInfo.injections.length > 0) {
        for (const injection of providerInfo.injections) {
          // Find which module exports this injection
          const exportedBy = moduleList.find((m) =>
            m.exports.includes(injection),
          );
          if (exportedBy) {
            puml += `${providerName} ..> ${injection} : uses\n`;
          } else {
            // Check if it's a provider in the same module
            const sameModuleProvider = Object.keys(module.providers).find(
              (p) => p === injection,
            );
            if (sameModuleProvider) {
              puml += `${providerName} ..> ${injection} : injects\n`;
            }
          }
        }
      }
    }
  }

  puml += "\n@enduml\n";

  // Write to file
  fs.writeFileSync(outputPath, puml, "utf-8");
}

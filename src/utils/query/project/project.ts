interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  priority: string;
  team: {
    name: string;
    slug: string;
  };
  lead: {
    name: string;
    email: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }

  const data: ProjectsResponse = await response.json();
  return data.projects;
}

export async function createProject(projectData: {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
}): Promise<Project> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }

  const data = await response.json();
  return data.project;
}

export async function updateProject(
  id: string,
  projectData: {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
  }
): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }

  const data = await response.json();
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.statusText}`);
  }
}

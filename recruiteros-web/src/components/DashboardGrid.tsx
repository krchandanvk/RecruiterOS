"use client";

import React, { useMemo, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import { 
  FileText, 
  Download, 
  Search, 
  MapPin, 
  Mail, 
  ExternalLink,
  Award,
  BookOpen,
  Briefcase,
  Users
} from "lucide-react";

interface DashboardGridProps {
  candidates: any[];
  onRowClick: (candidate: any) => void;
}

export function DashboardGrid({ candidates, onRowClick }: DashboardGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Grid column definitions mapping to target specifications
  const columnDefs = useMemo(() => [
    {
      headerName: "Photo",
      field: "profilePhotoUrl",
      width: 80,
      suppressMenu: true,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const photoUrl = params.value;
        const name = params.data.fullName || "";
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        if (photoUrl) {
          return (
            <div className="flex items-center justify-center h-full">
              <img
                src={photoUrl}
                alt={name}
                className="w-8 h-8 rounded-full border border-white/20 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center justify-center">
              {initials || <Users className="w-4 h-4" />}
            </div>
          </div>
        );
      },
    },
    {
      headerName: "Name",
      field: "fullName",
      width: 170,
      filter: "agTextColumnFilter",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      cellRenderer: (params: any) => (
        <span className="font-semibold text-foreground hover:text-blue-500 cursor-pointer">
          {params.value}
        </span>
      )
    },
    {
      headerName: "LinkedIn URL",
      field: "linkedinUrl",
      width: 140,
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-xs font-mono"
          onClick={(e) => e.stopPropagation()}
        >
          <span>in/profile</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )
    },
    {
      headerName: "AI Score",
      field: "candidateScore",
      width: 120,
      filter: "agNumberColumnFilter",
      cellRenderer: (params: any) => {
        const score = params.value;
        if (score === null || score === undefined) return <span className="text-muted-foreground">-</span>;
        
        let colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
        if (score < 50) colorClass = "bg-red-500/20 text-red-400 border-red-500/30";
        else if (score < 75) colorClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";

        return (
          <div className="flex items-center h-full">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}>
              {score}/100
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Completeness",
      field: "profileCompleteness",
      width: 130,
      filter: "agNumberColumnFilter",
      cellRenderer: (params: any) => {
        const score = params.value || 0;
        return (
          <div className="flex items-center gap-2 w-full h-full">
            <div className="w-12 bg-white/10 dark:bg-black/35 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs font-semibold">{score}%</span>
          </div>
        );
      }
    },
    {
      headerName: "Designation",
      field: "currentDesignation",
      width: 180,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Company",
      field: "currentCompany",
      width: 160,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Headline",
      field: "headline",
      width: 200,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Industry",
      field: "industry",
      width: 140,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Location",
      field: "location",
      width: 150,
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1 truncate text-xs">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>{params.value || "Not found"}</span>
        </div>
      )
    },
    {
      headerName: "Emails Found",
      field: "emails",
      width: 160,
      filter: "agTextColumnFilter",
      valueGetter: (params: any) => {
        const emails = params.data.emails || [];
        return emails.map((e: any) => e.email).join(", ");
      },
      cellRenderer: (params: any) => {
        const emails = params.data.emails || [];
        if (emails.length === 0) return <span className="text-muted-foreground text-xs">No email found</span>;
        return (
          <div className="flex items-center gap-1 text-xs truncate">
            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-medium">{emails[0].email}</span>
            {emails.length > 1 && (
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-muted-foreground font-bold font-sans">
                +{emails.length - 1}
              </span>
            )}
          </div>
        );
      }
    },
    {
      headerName: "GitHub",
      field: "emails",
      width: 120,
      filter: "agTextColumnFilter",
      valueGetter: (params: any) => {
        const emails = params.data.emails || [];
        const github = emails.find((e: any) => e.githubUrl);
        return github?.githubUrl || "";
      },
      cellRenderer: (params: any) => {
        const emails = params.data.emails || [];
        const github = emails.find((e: any) => e.githubUrl);
        if (!github?.githubUrl) return <span className="text-muted-foreground text-xs">-</span>;
        
        return (
          <a
            href={github.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs truncate font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <span>github</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
    },
    {
      headerName: "Top Skills",
      field: "skills",
      width: 200,
      valueGetter: (params: any) => {
        const skills = params.data.skills || [];
        return skills.map((s: any) => s.skillName).join(", ");
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return <span className="text-muted-foreground text-xs">-</span>;
        return (
          <div className="flex items-center gap-1 overflow-hidden h-full">
            {skills.slice(0, 3).map((s: any, idx: number) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] truncate max-w-[80px]">
                {s.skillName}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-semibold px-1 shrink-0">
                +{skills.length - 3}
              </span>
            )}
          </div>
        );
      }
    },
    {
      headerName: "Experience",
      field: "experiences",
      width: 130,
      valueGetter: (params: any) => {
        const exps = params.data.experiences || [];
        return exps.length ? `${exps.length} jobs` : "0 jobs";
      },
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Education",
      field: "education",
      width: 120,
      valueGetter: (params: any) => {
        const edus = params.data.education || [];
        return edus.length ? `${edus.length} institutes` : "0";
      },
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Certifications",
      field: "certifications",
      width: 130,
      valueGetter: (params: any) => {
        const certs = params.data.certifications || [];
        return certs.length ? `${certs.length} certs` : "0";
      },
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Award className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Last Updated",
      field: "updatedAt",
      width: 140,
      filter: "agDateColumnFilter",
      valueFormatter: (params: any) => {
        if (!params.value) return "";
        return new Date(params.value).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const gridOptions = {
    rowSelection: "multiple" as const,
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 20,
    sideBar: {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
        },
        {
          id: "filters",
          labelDefault: "Filters",
          labelKey: "filters",
          iconKey: "filter",
          toolPanel: "agFiltersToolPanel",
        },
      ],
      defaultToolPanel: "",
    },
  };

  const handleExportCSV = () => {
    gridRef.current?.api.exportDataAsCsv();
  };

  const handleExportExcel = () => {
    // AG Grid Enterprise handles direct Excel exports
    gridRef.current?.api.exportDataAsExcel({
      fileName: `recruiteros_candidates_${new Date().toISOString().slice(0, 10)}.xlsx`
    });
  };

  const handleExportPDF = () => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes() || [];
    const rowsToExport = selectedNodes.length > 0 
      ? selectedNodes.map(node => node.data) 
      : candidates;

    if (rowsToExport.length === 0) {
      alert("No candidates available to export");
      return;
    }

    // Build static HTML print layout
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Candidates Report - RecruiterOS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 24px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background-color: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .score { font-weight: bold; color: #2563eb; }
            .tag { display: inline-block; background: #e2e8f0; border-radius: 4px; padding: 2px 6px; font-size: 9px; margin-right: 4px; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>Candidate Intelligence Summary - RecruiterOS</h1>
          <p>Export Date: ${new Date().toLocaleDateString()} | Total Candidates: ${rowsToExport.length}</p>
          <table>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Designation & Company</th>
                <th>AI Score</th>
                <th>Emails Found</th>
                <th>GitHub</th>
                <th>Location</th>
                <th>Top Skills</th>
              </tr>
            </thead>
            <tbody>
              ${rowsToExport.map(c => {
                const emails = c.emails || [];
                const mainEmail = emails[0]?.email || "None";
                const github = emails.find((e: any) => e.githubUrl)?.githubUrl || "-";
                const skills = (c.skills || []).slice(0, 5).map((s: any) => `<span class="tag">${s.skillName}</span>`).join("");
                return `
                  <tr>
                    <td><strong>${c.fullName || "-"}</strong><br/><span style="color:#64748b; font-size: 10px;">${c.linkedinUrl}</span></td>
                    <td>${c.currentDesignation || "-"} at ${c.currentCompany || "-"}</td>
                    <td class="score">${c.candidateScore || "-"}%</td>
                    <td>${mainEmail}</td>
                    <td>${github}</td>
                    <td>${c.location || "-"}</td>
                    <td>${skills || "-"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportHiringReport = () => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes() || [];
    if (selectedNodes.length === 0) {
      alert("Please select at least one candidate from the grid to generate a Hiring Manager Report.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportContent = `
      <html>
        <head>
          <title>Hiring Manager Dossier - RecruiterOS</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1f2937; padding: 40px; background: #f9fafb; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
            .profile-section { display: flex; gap: 20px; margin-bottom: 30px; }
            .profile-pic { width: 80px; height: 80px; border-radius: 50%; object-cover: cover; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: #4b5563; }
            .profile-info h2 { margin: 0 0 5px 0; font-size: 24px; color: #111827; }
            .profile-info p { margin: 0; color: #4b5563; font-size: 14px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
            .badge-score { bg-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
            .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 30px 0 15px 0; }
            .summary-box { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .list-item { margin-bottom: 12px; }
            .list-item h4 { margin: 0; font-size: 14px; color: #111827; }
            .list-item p { margin: 0; font-size: 12px; color: #6b7280; }
            .tag { display: inline-block; background: #e5e7eb; border-radius: 4px; padding: 2px 8px; font-size: 11px; margin-right: 6px; margin-bottom: 6px; }
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          <div class="container">
            ${selectedNodes.map((node, index) => {
              const c = node.data;
              const name = c.fullName || "";
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
              const emails = c.emails || [];
              const github = emails.find((e: any) => e.githubUrl)?.githubUrl || "None";
              const skills = c.skills || [];
              const exps = c.experiences || [];
              const edus = c.education || [];

              return `
                <div class="${index < selectedNodes.length - 1 ? 'page-break' : ''}">
                  <div class="header">
                    <div>
                      <span style="font-size: 12px; font-weight: bold; color: #3b82f6; text-transform: uppercase;">RecruiterOS Intelligence Dossier</span>
                      <h1 style="margin: 5px 0 0 0; font-size: 28px;">Candidate Assessment</h1>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge badge-score" style="font-size: 14px; padding: 8px 16px;">AI Score: ${c.candidateScore || 0}%</span>
                    </div>
                  </div>

                  <div class="profile-section">
                    ${c.profilePhotoUrl 
                      ? `<img class="profile-pic" src="${c.profilePhotoUrl}" alt="${name}" />`
                      : `<div class="profile-pic">${initials}</div>`
                    }
                    <div class="profile-info">
                      <h2>${name}</h2>
                      <p style="font-size: 16px; font-weight: 500; color: #1f2937;">${c.currentDesignation || "-"} @ ${c.currentCompany || "-"}</p>
                      <p>${c.location || "Location not provided"}</p>
                      <p style="margin-top: 5px; font-family: monospace; font-size: 12px;">LinkedIn: ${c.linkedinUrl}</p>
                    </div>
                  </div>

                  <div class="section-title">Executive Summary</div>
                  <div class="summary-box">
                    <p style="margin: 0; font-style: italic; font-size: 14px;">"${c.candidateSummary || "AI summary not generated yet."}"</p>
                  </div>

                  <div class="grid-2">
                    <div>
                      <div class="section-title">Technical Assessment</div>
                      <p style="font-size: 13px;">${c.technicalSummary || "Assessment pending profile parsing completion."}</p>
                      
                      <div class="section-title">Best Fit Roles</div>
                      <p style="font-size: 13px;">${c.bestSuitableRoles ? JSON.parse(c.bestSuitableRoles).join(", ") : "-"}</p>
                    </div>
                    
                    <div>
                      <div class="section-title">Contact & Socials</div>
                      <p style="font-size: 13px; margin: 4px 0;"><strong>Primary Email:</strong> ${emails[0]?.email || "None"}</p>
                      <p style="font-size: 13px; margin: 4px 0;"><strong>GitHub Link:</strong> ${github}</p>
                      <p style="font-size: 13px; margin: 4px 0;"><strong>Industry:</strong> ${c.industry || "-"}</p>
                      <p style="font-size: 13px; margin: 4px 0;"><strong>Profile Completeness:</strong> ${c.profileCompleteness || 0}%</p>
                    </div>
                  </div>

                  <div class="section-title">Top Skills</div>
                  <div style="margin-bottom: 20px;">
                    ${skills.length > 0 
                      ? skills.map((s: any) => `<span class="tag"><strong>${s.category}:</strong> ${s.skillName}</span>`).join("")
                      : "No categorized skills parsed."
                    }
                  </div>

                  <div class="grid-2">
                    <div>
                      <div class="section-title">Recent Experience</div>
                      ${exps.slice(0, 3).map((e: any) => `
                        <div class="list-item">
                          <h4>${e.designation}</h4>
                          <p><strong>${e.company}</strong> | ${e.startDate || ""} - ${e.endDate || "Present"}</p>
                          <p style="font-size:11px; margin-top: 2px;">${e.description ? e.description.substring(0, 120) + '...' : ""}</p>
                        </div>
                      `).join("")}
                      ${exps.length === 0 ? "<p style='font-size:12px; color:#6b7280;'>No experiences available.</p>" : ""}
                    </div>
                    
                    <div>
                      <div class="section-title">Education Summary</div>
                      ${edus.slice(0, 2).map((edu: any) => `
                        <div class="list-item">
                          <h4>${edu.institute}</h4>
                          <p>${edu.degree || ""} ${edu.branch ? `in ${edu.branch}` : ""} (${edu.startYear || ""} - ${edu.endYear || ""})</p>
                        </div>
                      `).join("")}
                      ${edus.length === 0 ? "<p style='font-size:12px; color:#6b7280;'>No education records available.</p>" : ""}
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[600px]">
      {/* Grid Toolbar Controls */}
      <div className="p-4 border-b border-border bg-white/5 dark:bg-black/10 flex flex-wrap gap-4 justify-between items-center">
        {/* Quick Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Quick search candidate intelligence..."
            value={quickFilterText}
            onChange={(e) => {
              setQuickFilterText(e.target.value);
              gridRef.current?.api.setGridOption("quickFilterText", e.target.value);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs glass-input focus:bg-white/10 dark:focus:bg-black/30"
          />
        </div>

        {/* Exports Toolbar */}
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 glass-btn-secondary py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 glass-btn-secondary py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5 text-green-500" />
            Excel
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 glass-btn-secondary py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-white/10"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            PDF Table
          </button>

          <button
            onClick={handleExportHiringReport}
            className="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition-all backdrop-blur-sm shadow-md"
          >
            <FileText className="w-3.5 h-3.5" />
            Hiring Manager Report
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="ag-theme-alpine w-full flex-1">
        <AgGridReact
          ref={gridRef}
          rowData={candidates}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onRowClicked={(event) => {
            // Row clicked opens detail panel
            if (event.data) {
              onRowClick(event.data);
            }
          }}
        />
      </div>
    </div>
  );
}

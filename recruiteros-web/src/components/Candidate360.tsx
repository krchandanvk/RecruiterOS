"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Briefcase, 
  BookOpen, 
  Award, 
  FolderGit2, 
  Cpu, 
  Mail, 
  FileText, 
  Notebook, 
  Activity, 
  MapPin, 
  Globe, 
  Calendar,
  Plus,
  Loader2,
  ExternalLink
} from "lucide-react";

interface Candidate360Props {
  candidate: any;
  onClose: () => void;
  onNoteAdded?: () => void;
}

export function Candidate360({ candidate, onClose, onNoteAdded }: Candidate360Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "experience" | "education" | "certifications" | "projects" | "skills" | "contact" | "ai" | "notes" | "timeline"
  >("overview");
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notes, setNotes] = useState<any[]>(candidate.notes || []);

  useEffect(() => {
    setNotes(candidate.notes || []);
  }, [candidate]);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/candidates/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          noteContent: newNote.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setNewNote("");
        if (onNoteAdded) onNoteAdded();
      }
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const bestSuitableRoles = candidate.bestSuitableRoles 
    ? JSON.parse(candidate.bestSuitableRoles) 
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-4xl h-full bg-background border-l border-border shadow-2xl flex flex-col z-10 transition-transform duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-border bg-white/5 dark:bg-black/20 flex justify-between items-start">
          <div className="flex gap-4">
            {candidate.profilePhotoUrl ? (
              <img
                src={candidate.profilePhotoUrl}
                alt={candidate.fullName}
                className="w-16 h-16 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/20 text-xl font-bold flex items-center justify-center">
                {getInitials(candidate.fullName)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{candidate.fullName}</h1>
              <p className="text-sm font-semibold text-blue-500">{candidate.currentDesignation || "-"} @ {candidate.currentCompany || "-"}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {candidate.location || "No location info"}
                </span>
                <span>•</span>
                <span>{candidate.followersCount?.toLocaleString() || 0} followers</span>
                <span>•</span>
                <span>{candidate.connectionsCount || 0} connections</span>
                {candidate.openToWork && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.2 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold">
                      Open to Work
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 dark:hover:bg-black/35 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border bg-white/2px px-6 flex gap-1 overflow-x-auto select-none">
          {[
            { id: "overview", label: "Overview", icon: Globe },
            { id: "experience", label: "Experience", icon: Briefcase },
            { id: "education", label: "Education", icon: BookOpen },
            { id: "certifications", label: "Certifications", icon: Award },
            { id: "projects", label: "Projects", icon: FolderGit2 },
            { id: "skills", label: "Skills", icon: Cpu },
            { id: "contact", label: "Contact", icon: Mail },
            { id: "ai", label: "AI Assessment", icon: FileText },
            { id: "notes", label: "Recruiter Notes", icon: Notebook },
            { id: "timeline", label: "Timeline", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
                  active 
                    ? "border-blue-500 text-blue-500" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">About candidate</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {candidate.about || "No profile bio details captured."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-3">AI Score Card</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-3xl font-black text-blue-500">{candidate.candidateScore || 0}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Profile Assessment Rank</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-indigo-500">{candidate.profileCompleteness || 0}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Intelligence Completeness</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Suitable Roles</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bestSuitableRoles.map((role: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                        {role}
                      </span>
                    ))}
                    {bestSuitableRoles.length === 0 && (
                      <span className="text-muted-foreground text-xs">No roles assigned.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="relative border-l border-border pl-6 space-y-6">
              {candidate.experiences?.map((exp: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1 bg-blue-500 border-4 border-background w-4.5 h-4.5 rounded-full" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">{exp.designation}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-500 mt-1">
                      <span>{exp.company}</span>
                      {exp.employmentType && <span>({exp.employmentType})</span>}
                      <span>•</span>
                      <span className="text-muted-foreground">{exp.startDate || "N/A"} - {exp.endDate || "Present"}</span>
                      {exp.duration && <span className="text-muted-foreground">({exp.duration})</span>}
                    </div>
                    {exp.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{exp.location}</span>
                      </div>
                    )}
                    {exp.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2.5 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!candidate.experiences || candidate.experiences.length === 0) && (
                <p className="text-muted-foreground text-sm">No work experiences captured.</p>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div className="space-y-6">
              {candidate.education?.map((edu: any, idx: number) => (
                <div key={idx} className="glass-card rounded-xl p-5">
                  <h3 className="text-base font-bold text-foreground">{edu.institute}</h3>
                  <div className="text-sm text-blue-500 font-semibold mt-1">
                    {edu.degree || "-"} {edu.branch ? `in ${edu.branch}` : ""}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{edu.startYear || "N/A"} - {edu.endYear || "Present"}</span>
                    {edu.grade && (
                      <>
                        <span>•</span>
                        <span>Grade: {edu.grade}</span>
                      </>
                    )}
                  </div>
                  {edu.description && (
                    <p className="text-sm text-muted-foreground mt-2.5 whitespace-pre-line">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
              {(!candidate.education || candidate.education.length === 0) && (
                <p className="text-muted-foreground text-sm">No education records captured.</p>
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === "certifications" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.certifications?.map((cert: any, idx: number) => (
                <div key={idx} className="glass-card rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{cert.name}</h3>
                    <p className="text-xs text-blue-500 font-semibold mt-1">{cert.issuingOrganization}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Issued: {cert.issueDate || "N/A"} | Expires: {cert.expiryDate || "Never"}
                    </p>
                    {cert.credentialId && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        ID: {cert.credentialId}
                      </p>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-500 hover:text-blue-400 mt-4 flex items-center gap-1"
                    >
                      Verify Credential
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
              {(!candidate.certifications || candidate.certifications.length === 0) && (
                <p className="text-muted-foreground text-sm col-span-2">No certifications captured.</p>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              {candidate.projects?.map((proj: any, idx: number) => (
                <div key={idx} className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-bold text-foreground">{proj.name}</h3>
                  {proj.duration && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{proj.duration}</span>
                    </p>
                  )}
                  {proj.technology && (
                    <p className="text-xs text-blue-500 font-semibold mt-1">
                      Tech stack: {proj.technology}
                    </p>
                  )}
                  {proj.description && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
              {(!candidate.projects || candidate.projects.length === 0) && (
                <p className="text-muted-foreground text-sm">No projects captured.</p>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              {[
                "Backend", "Frontend", "Cloud", "AI", "DevOps", "Database", "Testing", "Mobile", "Security", "Other"
              ].map((category) => {
                const categorySkills = candidate.skills?.filter((s: any) => s.category.toLowerCase() === category.toLowerCase()) || [];
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category} className="glass-card rounded-xl p-5">
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((sk: any, idx: number) => (
                        <span key={idx} className="px-3 py-1 rounded bg-white/5 dark:bg-black/30 border border-white/5 text-xs font-semibold">
                          {sk.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(!candidate.skills || candidate.skills.length === 0) && (
                <p className="text-muted-foreground text-sm">No skills details categorized yet.</p>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Emails captured (Prog.AI)</h3>
                {candidate.emails?.map((em: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <div className="text-sm font-bold font-mono">{em.email}</div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                        <span>Source: {em.source}</span>
                        <span>•</span>
                        <span>Confidence: <strong className="text-blue-500">{em.confidence || "high"}</strong></span>
                        {em.verified && (
                          <>
                            <span>•</span>
                            <span className="text-green-500 font-semibold">Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                    {em.isPrimary && (
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
                {(!candidate.emails || candidate.emails.length === 0) && (
                  <p className="text-muted-foreground text-sm">No email addresses found.</p>
                )}
              </div>

              {/* Social profiles */}
              <div className="glass-card rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Social Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.emails?.[0]?.githubUrl && (
                    <a
                      href={candidate.emails[0].githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/30 transition-colors"
                    >
                      <Globe className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">GitHub Profile</div>
                        <div className="text-sm font-semibold truncate max-w-[250px]">{candidate.emails[0].githubUrl}</div>
                      </div>
                    </a>
                  )}
                  {candidate.emails?.[0]?.portfolioUrl && (
                    <a
                      href={candidate.emails[0].portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/30 transition-colors"
                    >
                      <Globe className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Portfolio</div>
                        <div className="text-sm font-semibold truncate max-w-[250px]">{candidate.emails[0].portfolioUrl}</div>
                      </div>
                    </a>
                  )}
                  {candidate.emails?.[0]?.websiteUrl && (
                    <a
                      href={candidate.emails[0].websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/30 transition-colors"
                    >
                      <Globe className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Personal Website</div>
                        <div className="text-sm font-semibold truncate max-w-[250px]">{candidate.emails[0].websiteUrl}</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Assessment Tab */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2.5">Candidate Summary</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {candidate.candidateSummary || "AI Candidate Summary not yet generated."}
                </p>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2.5">Technical Profile</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {candidate.technicalSummary || "AI Technical Summary assessment pending."}
                </p>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2.5">Experience & Background</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {candidate.experienceSummary || "AI Experience Summary evaluation pending."}
                </p>
              </div>
            </div>
          )}

          {/* Recruiter Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              {/* Add Note form */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-3">Add Reviewer Note</h3>
                <textarea
                  placeholder="Type candidate assessments, interview notes, or recruiter warnings here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs glass-input focus:bg-white/10 dark:focus:bg-black/30 resize-none font-sans"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !newNote.trim()}
                    className="flex items-center gap-1.5 glass-btn-primary py-2 px-4 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {notes.map((note: any, idx: number) => (
                  <div key={idx} className="glass-panel rounded-xl p-4 border-l-4 border-l-blue-500">
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {note.noteContent}
                    </p>
                    <div className="text-[10px] text-muted-foreground mt-3 font-semibold font-mono">
                      Recorded on: {new Date(note.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-6">No reviewer notes recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="relative border-l border-border pl-6 space-y-6 font-sans">
              <div className="relative">
                <span className="absolute -left-[30px] top-1 bg-green-500 w-3 h-3 rounded-full" />
                <h3 className="text-sm font-bold text-foreground">Scrape Session Initialized</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Queue item created</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[30px] top-1 bg-green-500 w-3 h-3 rounded-full" />
                <h3 className="text-sm font-bold text-foreground">Automated Profile Scraping Completed</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Captured all raw DOM data nodes from LinkedIn</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[30px] top-1 bg-green-500 w-3 h-3 rounded-full" />
                <h3 className="text-sm font-bold text-foreground">Prog.AI Contact Extraction</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Fetched emails and synced social handles</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[30px] top-1 bg-green-500 w-3 h-3 rounded-full" />
                <h3 className="text-sm font-bold text-foreground">AI Intelligence Assessment</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Generated score rank, summaries, and categorized skills</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[30px] top-1 bg-blue-500 w-3 h-3 rounded-full" />
                <h3 className="text-sm font-bold text-foreground">Recruiter Review Session</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Dossier active in intelligence grid (Last Updated: {new Date(candidate.updatedAt).toLocaleString()})</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

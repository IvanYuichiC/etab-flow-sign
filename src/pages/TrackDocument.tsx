import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function TrackDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [signatories, setSignatories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndFetchDocument();
  }, [id]);

  const checkUserAndFetchDocument = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    setProfile(profileData);

    // Fetch document - only if user is the creator
    const { data: docData } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("created_by", session.user.id)
      .maybeSingle();
    
    if (!docData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to track this document",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setDocument(docData);
    
    // Fetch signatories with profile info
    const { data: sigData } = await supabase
      .from("signatories")
      .select(`
        *,
        profiles:user_id (full_name, position, department)
      `)
      .eq("document_id", id)
      .order("order_index");
    
    if (sigData) setSignatories(sigData);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={profile} />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 mb-6" />
        </main>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={profile} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Document not found or access denied</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Document Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{document.title}</CardTitle>
                <p className="text-sm text-muted-foreground mb-4">
                  {document.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Document ID:</span>{" "}
                    <span className="text-muted-foreground">{document.document_id}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Type:</span>{" "}
                    <span className="text-muted-foreground">{document.document_type}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Department:</span>{" "}
                    <span className="text-muted-foreground">{document.department}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={document.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(document.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last Updated: {new Date(document.updated_at).toLocaleDateString()}
                </p>
                {document.file_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(document.file_url, '_blank')}
                    className="w-full mt-2"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Document
                  </Button>
                )}
              </div>
              {/* QR Code for Tracking */}
              <div className="border rounded-lg p-4 flex flex-col items-center">
                <p className="text-xs font-semibold mb-2">Track Document</p>
                <QRCodeSVG 
                  value={`${window.location.origin}/track/${id}`}
                  size={120}
                  level="H"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signatory Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Signatory Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signatories.map((signatory, index) => {
                const profile = signatory.profiles as any;
                const isSigned = !!signatory.signed_at;
                const isNext = !isSigned && (index === 0 || signatories[index - 1]?.signed_at);
                
                return (
                  <div
                    key={signatory.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      isSigned ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
                      isNext ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" :
                      "bg-muted/50"
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isSigned ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : isNext ? (
                        <Clock className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Signatory Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            Signatory {index + 1}: {profile?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {profile?.position} - {profile?.department}
                          </p>
                        </div>
                        {isSigned && (
                          <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                            Signed
                          </span>
                        )}
                        {isNext && (
                          <span className="text-xs font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                      </div>

                      {isSigned && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Signed on: {new Date(signatory.signed_at).toLocaleString()}
                          </p>
                          {signatory.remarks && (
                            <p className="text-sm text-muted-foreground">
                              Remarks: {signatory.remarks}
                            </p>
                          )}
                        </div>
                      )}

                      {isNext && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate(`/sign/${document.id}`)}
                        >
                          View Signing Page
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </main>
    </div>
  );
}

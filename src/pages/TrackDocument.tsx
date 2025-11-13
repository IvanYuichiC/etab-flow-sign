import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import logo from "@/assets/logo.jpg";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackDocument() {
  const { id } = useParams();
  const [document, setDocument] = useState<any>(null);
  const [signatories, setSignatories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    
    // Fetch document
    const { data: docData } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (docData) {
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
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <div className="container mx-auto max-w-3xl py-8">
          <Skeleton className="h-64 mb-6" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Document not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="container mx-auto max-w-3xl py-8">
        {/* Header */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="eTabecon" className="h-16" />
        </div>

        {/* Document Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-mono text-muted-foreground">
                    {document.document_id}
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">{document.title}</CardTitle>
                {document.description && (
                  <p className="text-muted-foreground">{document.description}</p>
                )}
              </div>
              <StatusBadge status={document.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span>
                <p className="text-muted-foreground">{document.document_type}</p>
              </div>
              <div>
                <span className="font-medium">Department:</span>
                <p className="text-muted-foreground">{document.department}</p>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-muted-foreground">
                  {format(new Date(document.created_at), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <p className="text-muted-foreground">
                  {format(new Date(document.updated_at), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signatory Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Signatory Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signatories.map((signatory, index) => (
                <div key={signatory.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        signatory.status === "Completed"
                          ? "bg-success text-white"
                          : signatory.status === "In Progress"
                          ? "bg-info text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {signatory.status === "Completed" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    {index < signatories.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {signatory.profiles?.full_name || "Unknown"}
                        </p>
                        {signatory.profiles?.position && (
                          <p className="text-sm text-muted-foreground">
                            {signatory.profiles.position}
                            {signatory.profiles.department &&
                              ` • ${signatory.profiles.department}`}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={signatory.status} />
                    </div>
                    {signatory.signed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Signed on {format(new Date(signatory.signed_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    )}
                    {signatory.remarks && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p className="font-medium">Remarks:</p>
                        <p className="text-muted-foreground">{signatory.remarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createStudyRoom } from "@/services/study";
import { QKEY_STUDY_ROOMS } from "@/constants/queryKeys";
import { getStudyRoomRoute } from "@/constants/routes";
import { apiErrorMessage } from "../utils/studyState";

interface WatchTogetherButtonProps {
  gameId: number;
  white: string;
  black: string;
  className?: string;
}

/**
 * Watch together: opens a study room that follows this live game, for
 * analysing it with friends (invite them from the room). The players can't
 * see it until the game is over.
 */
export const WatchTogetherButton = ({ gameId, white, black, className }: WatchTogetherButtonProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () => createStudyRoom({ name: `${white} vs ${black}`.slice(0, 80), gameId }),
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
      navigate(getStudyRoomRoute(room.id));
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, "Couldn't open a room for this game. Try again."), { id: "watch-together" }),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => create.mutate()}
      disabled={create.isPending}
      title="A private analysis board and chat for you and your friends; the players can't see it"
    >
      {create.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UsersRound aria-hidden="true" />}
      Watch together
    </Button>
  );
};
